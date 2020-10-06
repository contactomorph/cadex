import { v4 as uuid } from 'uuid'
import * as firebase from 'firebase/app'

function oupdate(tgt: { [key: string]: any }, src: { [key: string]: any }) {
  for (const key of Object.keys(tgt)) {
    if (key in tgt && src[key] !== undefined && src[key] !== null) {
      tgt[key] = src[key];
    }
  }
}

//  databaseURL: "http://localhost:9000/?ns=undefined"
type Reference = firebase.database.Reference

class DBObject<T> {
  protected ref: Reference
  public readonly data: T
  private readonly listeners = new Array<(o: DBObject<T>) => void>()
  public exists = false

  constructor(ref: Reference, data: T) {
    this.ref = ref
    this.data = data
  }

  protected updateData(data: Partial<T>) {
    oupdate(this.data, data)
  }

  public async load() {
    const data = (await this.ref.once('value')).val()
    this.exists = (data)? true: false
    if (!this.exists) {
      return
    }
    this.updateData(data)
    for (const listener of this.listeners) {
      listener(this)
    }
  }

  public async save() {
    await this.ref.update(this.toJSON())
  }

  public toJSON(): T {
    return this.data
  }

  public async update(data: Partial<T>, all?: boolean) {
    this.updateData(data)
    if (all) {
      await this.save()
    } else {
      await this.ref.update(data)
    }
  }

  public enableAutoUpdate() {
    this.ref.on('value', (snapshot) => {
      const data = snapshot.val()
      this.exists = (data)? true: false
      if(!this.exists) {
        return
      }
      this.updateData(data)
      for (const listener of this.listeners) {
        listener(this)
      }
    })
  }

  public addUpdateListener(listener: ((o: DBObject<T>) => void)): void {
    this.listeners.push(listener)
  }
}

class PlayerPublicData {
  name = ''
  played = false
  myTurn = false
  num = 0
  sid = ''
}

class PlayerPrivateData extends PlayerPublicData {
  id = ''
  head = ''
  tail = ''
  ptail = ''
}

class PlayerPublic extends DBObject<PlayerPublicData> {
  constructor(sid: string, num: number) {
    super(firebase.database().ref('stories').child(sid).child('players').child(num.toString()), new PlayerPublicData())
    this.data.sid = sid
    this.data.num = num
  }
}

class PlayerPrivate extends DBObject<PlayerPrivateData> {
  constructor(sid: string, uid: string) {
    super(firebase.database().ref('chunks').child(sid).child(uid), new PlayerPrivateData())
    this.data.sid = sid
    this.data.id = uid
  }
}

class Player {
  private _public: PlayerPublic
  private _private: PlayerPrivate

  public readonly publicData: PlayerPublicData
  public readonly privateData: PlayerPrivateData

  constructor(sid: string, uid: string, num: number) {
    this._public = new PlayerPublic(sid, num)
    this._private = new PlayerPrivate(sid, uid)
    this.publicData = this._public.data
    this.privateData = this._private.data
  }

  public async load() {
    await this._public.load()
    await this._private.load()
  }

  public async save() {
    await this._public.save()
    await this._private.save()
  }

  public async update(data: Partial<PlayerPrivateData>, all?: boolean) {
    await this._public.update(data, all)
    await this._private.update(data, all)
  }

  public toJSON() {
    return this._public.toJSON()
  }
}

interface PlayerOrderData {
  [key: string]: string;
}

class PlayerOrder extends DBObject<PlayerOrderData> {
  constructor(sid: string) {
    super(
      firebase.database().ref('privateStories').child(sid),
      {} as PlayerOrderData
    )
  }

  protected updateData(data: Partial<PlayerOrderData>) {
    Object.assign(this.data, data)
  }

  public who(num: number): string {
    return this.data[num.toString()]
  }

  public async register(num: number, uid: string) {
    const data = { } as PlayerOrderData
    data[num.toString()] = uid

    await super.update(data)
  }

}

class StoryData {
  id = ''
  playerNumber = 0
  registering = true
  completed = false
  currentPlayer = 0
  players: { [key: number]: Partial<PlayerPrivateData> } = {}
}


class Story extends DBObject<StoryData> {
  constructor(id?: string) {
    id = (id)? id: uuid()
    super(
      firebase.database().ref('stories').child(id),
      new StoryData()
    )
    this.data.id = id
  }

  public async finalize() {
    const privateData = (await firebase.database().ref('chunks').child(this.data.id).once('value')).val()

    const tgt = {} as { [key: number]: Partial<PlayerPrivateData> }
    const all = Object.values(privateData) as Array<PlayerPrivateData>

    for (const player of all) {
      tgt[player.num] = player
      delete player['id']
    }

    await this.update({
      completed: true,
      players: tgt
    })
  }
}

export {
  Player as Player,
  PlayerPrivate as PlayerPrivate,
  Story as Story,
  PlayerOrder as PlayerOrder
}
