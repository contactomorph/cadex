import * as firebase from 'firebase/app'
import 'firebase/database'
import { v4 as uuid } from 'uuid'

const firebaseConfig = {
  apiKey: "AIzaSyC8rR63t7K3Spv97jNn7bvlq8EHVXB479s",
  authDomain: "cadex-a057e.firebaseapp.com",
  databaseURL: "https://cadex-a057e.firebaseio.com",
  projectId: "cadex-a057e",
  storageBucket: "cadex-a057e.appspot.com",
  messagingSenderId: "633469560244",
  appId: "1:633469560244:web:1ff4dfdeef557038d47ee1"
}

function initialize() {
  console.log("Initialize backend")
  firebase.initializeApp(firebaseConfig)
}

abstract class DBObject {
  readonly id: string
  readonly parent: DBObject | null
  readonly childs: Array<DBObject> = []
  readonly db = firebase.database()
  readonly refname: string
  lastSaveTS = 0

  constructor(refname: string, parent: DBObject|null, id?: string) {
    console.log(this)
    this.parent = parent
    if(this.parent) {
      this.parent.childs.push(this)
    }
    this.refname = refname
    if(id) {
      this.id = id
      this.load()
    } else {
      this.id = uuid()
    }
    this.registerListener()
  }

  protected ref(): Reference {
    let base: Reference
    if(this.parent) {
      base = this.parent.ref()
    } else {
      base = this.db.ref()
    }
    base = base.child(this.refname).child(this.id)
    return base
  }

  protected abstract serialize(): object
  protected abstract update(data: object): void

  private __update(snapshot: Snapshot): void {
    const data = snapshot.val()
    if(data) {
      this.update(data)
    }
  }

  protected load(): void {
    this.ref().once('value', (x) => this.__update(x))
  }

  private registerListener(): void {
    this.ref().on('value', (x) => this.__update(x))
  }

  public save(): void {
    const data = this.serialize()
    this.ref().update(data).then(() => {
      this.lastSaveTS = Date.now()
      for(const child of this.childs) {
        child.save()
      }
    })
  }
}

class Chunk {
  head = ''
  tail = ''
  player: Player

  constructor(player: Player, head: string, tail: string) {
    this.head = head
    this.tail = tail
    this.player = player
  }
}

type MyTurnFunction = ((player: Player, tail: string) => void) | null
type TurnFunction = ((player: Player) => void) | null
type TheEndFunction = ((chunks: Array<Chunk>) => void) | null
type Reference = firebase.database.Reference
type Snapshot = firebase.database.DataSnapshot

interface PlayerData {
  name: string;
  myturn: boolean;
  played: boolean;
  head: string;
  tail: string;
  ptail: string;
}

class Player extends DBObject {
  public name: string
  public played = false
  public myturn = false
  story: Story
  myTurnCallback: MyTurnFunction = null

  /* just for debug */
  ptail = ''
  head = ''
  tail = ''

  constructor(name: string, story: Story, id?: string) {
    super('players', story, id)
    this.name = name
    this.story = story
  }

  public play(head: string, tail: string) {
    this.head = head
    this.tail = tail
    this.played = true
    this.myturn = false
    this.story.turn()
  }

  setMyTurnCallback(callback: MyTurnFunction) {
    this.myTurnCallback = callback
    this.load() // Force to trigger the callback if it is my turn
  }

  myTurn(tail: string) {
    this.ptail = tail
    this.myturn = true
    this.save()
  }

  protected serialize(): PlayerData {
    return {
      name: this.name,
      myturn: this.myturn,
      played: this.played,
      head: this.head,
      tail: this.tail,
      ptail: this.ptail,
    }
  }

  protected update(data: PlayerData): void {
    this.name = data.name
    this.played = data.played
    this.head = data.head
    this.tail = data.tail
    this.myturn = data.myturn
    this.ptail = data.ptail
    if(this.myturn && this.myTurnCallback) {
      this.myTurnCallback(this, this.ptail)
    }
  }

}

enum StoryState {
  Starting = 0,
  Registering,
  Writting,
  End
}

interface StoryData {
  playerNumber: number;
  state: StoryState;
}

class Story extends DBObject {
  /* Public attributes */
  players: Array<Player> = []
  playerNumber = 0
  state = StoryState.Starting
  lastSaveTS = 0

  /* Private attributes */
  private turnCallback: TurnFunction = null
  private theEndCallback: TheEndFunction = null

  /* Static */
  static join(id: string, myname: string): [Story, Player] {
    const story = new Story(id)
    const player = story.addPlayer(myname)
    return [story, player]
  }

  /* Constructor */
  constructor(id?: string) {
    super('stories', null, id)
  }

  /* Public methods */
  public startRegistration(players: number): void {
    if(this.state !== StoryState.Starting) {
      throw "The story is not in this initial state"
    }
    this.state = StoryState.Registering
    this.playerNumber = players
    this.save()
  }

  public addPlayer(name: string) {
    if(this.state!==StoryState.Registering) {
      throw "Story is not ready to add player"
    }
    const player = new Player(name, this);
    this.players.push(player)
    if(this.players.length == this.playerNumber) {
      this.start()
    }
    this.save()
    return player
  }

  public start(): void {
    this.state = StoryState.Writting
    setTimeout(() => {
      console.log("Start playing")
      this.turn()
    }, 1000)
  }

  setTurnCallback(callback: TurnFunction) {
    this.turnCallback = callback
  }

  setTheEndCallback(callback: TheEndFunction) {
    this.theEndCallback = callback
  }

  get url(): string {
    if(this.state === StoryState.Starting) {
      throw "You must start registration before broadcast url"
    }
    return "http://localhost/"+this.id
  }

  public turn(): void {
    if(this.state!==StoryState.Writting) {
      throw "Story is not ready to progress"
    }
    let tail = ''
    for(const player of this.players) {
      if(!player.played) {
        if(this.turnCallback) {
          this.turnCallback(player)
        }
        player.myTurn(tail)
        this.save()
        return
      } else {
        tail = player.tail
      }
    }
    this.state = StoryState.End
    this.save()
    if(this.theEndCallback) {
      const chunks: Array<Chunk> = []
      for(const player of this.players) {
        chunks.push(new Chunk(player, player.head, player.tail))
      }
      this.theEndCallback(chunks)
    }
  }

  /* Protected methods */
  protected serialize(): StoryData {
    return {
      playerNumber: this.playerNumber,
      state: this.state,
    }
  }

  protected update(data: StoryData): void {
    this.playerNumber = data.playerNumber
    this.state = data.state
  }

}

export {
  initialize,
  Story as Story,
  Player as Player,
  Chunk as Chunk,
}
