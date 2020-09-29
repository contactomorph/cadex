import * as firebase from 'firebase/app'
import 'firebase/database'
import { v4 as uuid } from 'uuid'
import * as crypto from 'crypto'

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

type ClassType = new (...args: any[]) => DBObject

interface StoreType {
  [key: string]: ClassType;
}

class TypeStore {
  private store: StoreType = {}
  private static _instance: TypeStore

  public static get instance(): TypeStore {
    if(!TypeStore._instance) {
      TypeStore._instance = new TypeStore()
    }
    return TypeStore._instance
  }

  add(ttype: ClassType): void {
    this.store[ttype.name] = ttype
  }

  get(stype: string): ClassType {
    return this.store[stype]
  }
}

interface DBObjectData {
  [key: string]: any;
}

interface ChildReferences {
  // Id => DBObjectLink
  [key: string]: DBObjectLink;
}

class DBObjectLink {
  readonly refname: string
  readonly parent: DBObject|null
  readonly child: DBObject
  constructor(parent: DBObject|null, child: DBObject, refname: string) {
    this.refname = refname
    this.child = child
    this.parent = parent
  }
}

abstract class DBObject {
  readonly id: string
  readonly parentLink: DBObjectLink
  readonly childs: ChildReferences = {}
  readonly db = firebase.database()
  readonly data: DBObjectData = {}
  updateCallback: UpdateFunction = null

  private childTypes: Map<string, string> = new Map()
  private sign = ''

  constructor(refname: string, parent: DBObject|null, id?: string) {
    if(id) {
      this.id = id
    } else {
      this.id = uuid()
    }

    this.data.id = this.id
    this.parentLink = new DBObjectLink(parent, this, refname)
    if(parent) {
      parent.childs[this.id] = this.parentLink
      parent.childTypes.set(refname, this.constructor.name)
    }

    this.registerListener()
  }

  protected signature(): string {
    const data = Object.entries(this.serialize()).sort((a, b) => { return a[0].localeCompare(b[0] )})
    let sign = JSON.stringify(data)
    for (const link of Object.values(this.childs).sort((a, b) => { return a.child.id.localeCompare(b.child.id)})) {
      sign = sign + link.child.signature()
    }
    const shasum = crypto.createHash('sha1')
    shasum.update(sign)
    return shasum.digest('hex')
  }

  protected ref(): Reference {
    let base: Reference
    if(this.parentLink.parent) {
      base = this.parentLink.parent.ref()
    } else {
      base = this.db.ref()
    }
    base = base.child(this.parentLink.refname).child(this.id)
    return base
  }

  protected serialize(): DBObjectData {
    /* Serialize own data */
    const data: DBObjectData = {}
    for (const key of Object.keys(this.data)) {
      data[key] = this.data[key]
    }

    data['__TYPES__'] = {} as DBObjectData
    for (const [key, value] of this.childTypes.entries()) {
      data['__TYPES__'][key] = value
    }
    return data
  }

  private async __update(snapshot: Snapshot) {
    const data: DBObjectData = snapshot.val()
    if(!data) return;

    const skip: {[id: string]: boolean} = {}

    /* Update known childs */
    for (const link of Object.values(this.childs)) {
      skip[link.child.id] = true
      /* Anything else because the childs is self updated */
    }
    //console.log("Update "+this.constructor.name)

    if (data['__TYPES__']) {
      for (const [key, value] of Object.entries(data['__TYPES__'])) {
        this.childTypes.set(key, value as string)
      }
    }

    for (const [key, value] of Object.entries(data)) {
      //console.log("Key: "+key+ " value: "+JSON.stringify(value))
      if (this.childTypes.has(key)) {
        // This is a child collection
        const clazz = TypeStore.instance.get(this.childTypes.get(key) as string)
        for (const [childId, childData] of Object.entries(value)) {
          if (childId in skip) {
            continue
          }
          const obj = new clazz(key, this, (childData as {[key: string]: string})['id'])
          await obj.load()
          /* new object self record */
        }
      } else {
        this.data[key] = value
      }
    }
  }

  private __fullUpdate(snapshot: Snapshot): void {
    this.__update(snapshot).then(() => {
      if (this.updateCallback) {
        this.updateCallback(this)
      }
      this.updated()
    })
  }

  public async load() {
    await this.ref().once('value', (x) => { this.__fullUpdate(x)})
    return this
  }

  public setUpdateCallback(callback: UpdateFunction): void {
    this.updateCallback = callback
  }

  protected updated(): void {
    return
  }

  private registerListener(): void {
    this.ref().on('value' ,(x) => {this.__fullUpdate(x)})
  }

  public async save() {
    if (this.signature() == this.sign) {
      return
    }

    this.sign = this.signature()
    const data = this.serialize()
    //console.log("Data: " +JSON.stringify(data))
    await this.ref().update(data)
    for(const link of Object.values(this.childs)) {
      await link.child.save()
    }

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

type UpdateFunction = ((obj: DBObject) => void) | null
type MyTurnFunction = ((player: Player, tail: string) => void) | null
type TurnFunction = ((player: Player) => void) | null
type TheEndFunction = ((chunks: Array<Chunk>) => void) | null
type Reference = firebase.database.Reference
type Snapshot = firebase.database.DataSnapshot

interface PlayerData extends DBObjectData {
  name: string;
  myturn: boolean;
  played: boolean;
  head: string;
  tail: string;
  ptail: string;
}

class Player extends DBObject {
  story: Story
  myTurnCallback: MyTurnFunction = null

  /* just for debug */
  ptail = ''
  head = ''
  tail = ''

  constructor(name: string, story: Story, id?: string) {
    super('players', story, id)
    this.data.name = name
    this.story = story
  }

  public play(head: string, tail: string) {
    this.data.head = head
    this.data.tail = tail
    this.data.played = true
    this.data.myturn = false
    this.save()
  }

  setMyTurnCallback(callback: MyTurnFunction) {
    this.myTurnCallback = callback
    if (this.data.myturn && callback) {
      callback(this, this.data.ptail)
    }
  }

  async myTurn(tail: string) {
    this.data.ptail = tail
    this.data.myturn = true
    await this.save()
    if (this.myTurnCallback) {
      this.myTurnCallback(this, tail)
    }
  }
}

TypeStore.instance.add(Player)

enum StoryState {
  Starting = 0,
  Registering,
  Writting,
  End
}

interface StoryData extends DBObjectData {
  playerNumber: number;
  state: StoryState;
  players?: object;
}

class Story extends DBObject {
  /* Private attributes */
  private turnCallback: TurnFunction = null
  private theEndCallback: TheEndFunction = null

  /* Constructor */
  constructor(id?: string) {
    super('stories', null, id)
    this.data.playerNumber = 0
    this.data.state = StoryState.Starting
  }

  /* Public methods */
  public async startRegistration(players: number) {
    console.log("Start registration")
    if(this.data.state !== StoryState.Starting) {
      throw "The story is not in this initial state"
    }
    this.data.state = StoryState.Registering
    this.data.playerNumber = players
    await this.save()
  }

  public get players(): Array<Player> {
    const players = Object.values(this.childs).filter((x: DBObjectLink) => x.refname === "players").map((x: DBObjectLink) => x.child)
    return players as Array<Player>
  }

  public async addPlayer(name: string) {
    if(this.data.state!==StoryState.Registering) {
      throw "Story is not ready to add player"
    }

    console.log("Create Player")
    const player = new Player(name, this);
    console.log("Player created")

    await this.save()

    if(this.players.length == this.data.playerNumber) {
      await this.start()
    }

    return player
  }

  public async start() {
    this.data.state = StoryState.Writting
    console.log("Start playing")
    await this.save()
    await this.turn()
  }

  public join(id: string): Player {
    for (const player of this.players) {
      if (player.id === id) {
        return player
      }
    }
    throw "Unknown player"
  }

  setTurnCallback(callback: TurnFunction) {
    this.turnCallback = callback
  }

  setTheEndCallback(callback: TheEndFunction) {
    this.theEndCallback = callback
    if (this.data.state == StoryState.End) {
      this.commitTheEnd()
    }
  }

  get url(): string {
    if(this.data.state === StoryState.Starting) {
      throw "You must start registration before broadcast url"
    }
    return window.location.origin+"/stories/" + this.id
  }

  public async turn() {
    if(this.data.state!==StoryState.Writting) {
      throw "Story is not ready to progress"
    }
    let tail = ''
    for(const player of this.players) {
      if(!player.data.played) {
        if(this.turnCallback) {
          this.turnCallback(player)
        }
        await player.myTurn(tail)
        await this.save()
        return
      } else {
        tail = player.data.tail
      }
    }
    this.data.state = StoryState.End
    await this.save()
    this.commitTheEnd()
  }

  private commitTheEnd() {
    if(this.theEndCallback) {
      const chunks: Array<Chunk> = []
      for(const player of this.players) {
        chunks.push(new Chunk(player, player.data.head, player.data.tail))
      }
      this.theEndCallback(chunks)
    }
  }

  protected async updated() {
    if (this.data.state == StoryState.Writting) {
      await this.turn()
    }
  }
}

TypeStore.instance.add(Story)

export {
  initialize,
  Story as Story,
  Player as Player,
  Chunk as Chunk,
  StoryState as StoryState
}
