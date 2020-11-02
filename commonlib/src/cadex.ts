import { v4 as uuid } from 'uuid'

/**
 * Select statically the firebase SDK
 */

interface DataSnapshot {
  child(path: string): DataSnapshot;
  exists(): boolean;
  key: string | null;
  ref: Reference;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  val(): any;
}

interface Reference {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  on(
    eventType: 'value',
    callback: (a: DataSnapshot, b?: string | null) => any,
  ): any;
  /* eslint-enable */

  once(eventType: 'value'): Promise<DataSnapshot>;

  child(path: string): Reference;

  /* eslint-disable */
  update(values: Object): Promise<any>;
  /* eslint-enable */
}

interface Database {
  ref(path?: string | Reference): Reference;
}

class FirebaseSDK {
  public static DB: Database
}

function initializeCadex(db: Database): void {
  FirebaseSDK.DB = db
}


/**
 * DBObject<T> is an object in firebase realtime database
 * It adds some shortcuts for load and save
 *
 */
class DBObject<T> {
  protected ref: Reference
  public readonly data: T
  private readonly listeners = [] as Array<(o: DBObject<T>) => void>
  public exists = false

  constructor(ref: Reference, data: T) {
    this.ref = ref
    this.data = data
  }

  protected updateData(data: Partial<T>): void {
    const src = data as Record<string, unknown>
    const tgt = this.data as Record<string, unknown>

    for (const key of Object.keys(tgt)) {
      if (src[key] !== undefined && src[key] !== null) {
        tgt[key] = src[key]
      }
    }
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

  public async enableAutoUpdate() {
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
  num = -1
  sid = ''
}
/**
 * This is the public representation for a player
 * typically use as a subobject of a story.
 * The public player object does not expose its private id
 * (currently set as uid from firebase anonymous authentication)
 */
class PlayerPublic extends DBObject<PlayerPublicData> {
  constructor(sid: string, num: number) {
    super(FirebaseSDK.DB.ref('stories').child(sid).child('players').child(num.toString()), new PlayerPublicData())
    this.data.sid = sid
    this.data.num = num
  }
}

class PlayerPrivateData extends PlayerPublicData {
  constructor() {
    super()
  }
  id = ''
  head = ''
  tail = ''
  ptail = ''
}
/**
 * This is the private representation for a player
 * The player can modify whatever he wants in this space
 */
class PlayerPrivate extends DBObject<PlayerPrivateData> {
  constructor(sid: string, uid: string) {
    super(FirebaseSDK.DB.ref('players').child(sid).child(uid), new PlayerPrivateData())
    this.data.sid = sid
    this.data.id = uid
  }
}

/**
 * Player object is the full admin compatible representation of a player
 * with the public and private part.
 * All public data are written in public AND private space
 * The private data are written only in private space.
 */
class Player {
  private _public: PlayerPublic
  private _private: PlayerPrivate

  public readonly publicData: PlayerPublicData
  public readonly privateData: PlayerPrivateData

  constructor(sid: string, uid: string, num: number) {
    this._public = new PlayerPublic(sid, num)
    this._private = new PlayerPrivate(sid, uid)
    this._private.data.num = num
    this.publicData = this._public.data
    this.privateData = this._private.data
  }

  public async load(): Promise<void> {
    await this._public.load()
    await this._private.load()
  }

  public async save(): Promise<void> {
    await this._public.save()
    await this._private.save()
  }

  public async update(data: Partial<PlayerPrivateData>, all?: boolean): Promise<void> {
    await this._public.update(data, all)
    await this._private.update(data, all)
  }

  public toJSON(): PlayerPublicData {
    return this._public.toJSON()
  }
}

interface PlayerOrderData {
  [key: number]: string;
}
/**
 * PlayerOrder objects are a map to retrive the player id
 * from its rank in the story. The structure can be accessed
 * only by admin user
 */
class PlayerOrder extends DBObject<PlayerOrderData> {
  private sid: string

  constructor(sid: string) {
    super(
      FirebaseSDK.DB.ref('playerMap').child(sid),
      {} as PlayerOrderData
    )
    this.sid = sid
  }

  /* Override updateData function */
  protected updateData(data: Partial<PlayerOrderData>): void {
    Object.assign(this.data, data)
  }

  /**
   * Find the player id from its number for a story
   */
  public who(num: number): Player|null {
    const uid = this.data[num]
    if (uid) {
      return new Player(this.sid, uid, num)
    } else {
      return null
    }
  }

  /**
   * Record a player id with the right number
   */
  public async register(num: number, uid: string): Promise<void> {
    const data = { } as PlayerOrderData
    data[num] = uid

    await super.update(data)
  }

}

type U<T> = { [K in keyof T] : T[K] }
type PlayerStoryData = U<PlayerPublicData & Partial<PlayerPrivateData>>

class StoryData {
  id = ''
  completed = false
  currentPlayer = 0
  players = [] as Array<PlayerStoryData>
}

/**
 * A Story object is the public data that represents a story
 */
class Story extends DBObject<StoryData> {
  constructor(id?: string) {
    const theid = (id)? id: uuid()
    super(
      FirebaseSDK.DB.ref('stories').child(theid),
      new StoryData()
    )
    this.data.id = theid
  }

  public async finalize(): Promise<void> {
    /**
     * finalize function copies final data from private space
     * of players into the public space
     */
    const privateData = (await FirebaseSDK.DB.ref('players').child(this.data.id).once('value')).val()

    const all = Object.values(privateData)
    const tgt = new Array<PlayerStoryData>(all.length)

    /* do not forget to remove private id of the players */
    for (const player of all) {
      const splayer = player as PlayerPrivateData
      const tplayer = {} as PlayerStoryData
      Object.assign(tplayer, splayer)
      if (tplayer.num || tplayer.num === 0) {
        tgt[tplayer.num] = tplayer
        delete tplayer['id']
      }
    }

    /* set completed flag to true and copy data */
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
  PlayerOrder as PlayerOrder,
  initializeCadex
}
