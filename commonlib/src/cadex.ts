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

  transaction ( transactionUpdate :  ( a :  any ) => any ,  onComplete ? :  ( a :  Error | null ,  b :  boolean ,  c :  DataSnapshot | null ) => any ,  applyLocally ? :  boolean ) : Promise < any >
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

  protected updateData(data: Partial<T>): Partial<T> {
    const src = data as Record<string, unknown>
    const tgt = this.data as Record<string, unknown>
    const partialTgt = {} as Record<string, unknown>

    for (const key of Object.keys(tgt)) {
      if (src[key] !== undefined && src[key] !== null) {
        tgt[key] = src[key]
        partialTgt[key] = src[key]
      }
    }
    return partialTgt as Partial<T>
  }

  public async atomic(handler: (d: T|null) => T|null) {
    await this.ref.transaction(handler)
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
    const partialUpdate = this.updateData(data)
    if (all) {
      await this.save()
    } else {
      await this.ref.update(partialUpdate)
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
  key = ''
  sid = ''
  continuation = ''
  color = ''
}
/**
 * This is the public representation for a player
 * typically use as a subobject of a story.
 * The public player object does not expose its private id
 * (currently set as uid from firebase anonymous authentication)
 */
class PlayerPublic extends DBObject<PlayerPublicData> {
  constructor(sid: string, key: string) {
    super(FirebaseSDK.DB.ref('stories').child(sid).child('players').child(key), new PlayerPublicData())
    this.data.sid = sid
    this.data.key = key
  }
}

class Contribution {
  head = ''
  tail = ''

  constructor(head: string, tail: string) {
    this.head = head
    this.tail = tail
  }
}

class PlayerPrivateData extends PlayerPublicData {
  constructor() {
    super()
  }
  id = ''
  ptail = ''
  contributions = new Array<Contribution>()
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

  constructor(sid: string, uid: string, key: string) {
    this._public = new PlayerPublic(sid, key)
    this._private = new PlayerPrivate(sid, uid)
    this._private.data.key = key
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

type U<T> = { [K in keyof T] : T[K] }
type PlayerStoryData = U<PlayerPublicData & Partial<PlayerPrivateData>>

class StoryData {
  id = ''
  started = false
  completed = false
  admin = ''
  players = {} as Record<string, PlayerStoryData>
  order = new Array<string>()

  /* A game is one or several TURN, composed by player round */
  round = 0
  turn = 0
  rounds = new Array<string>() // the real (without skips) players rounds for the final result
}

/**
 * A Story object is the public data that represents a story
 */
class Story extends DBObject<StoryData> {
  public static ROOT = '/stories'

  constructor(id?: string) {
    const theid = (id)? id: uuid()
    super(
      FirebaseSDK.DB.ref(Story.ROOT).child(theid),
      new StoryData()
    )
    this.data.id = theid
  }

  public playersRef(): Reference {
    return this.ref.child('players')
  }

  public async atomicUpdateWithPrivateData(  handler: ((s: StoryData|null, d: Array<PlayerPrivateData>) => (StoryData|null))):Promise<void> {
    const privateData = (await FirebaseSDK.DB.ref('players').child(this.data.id).once('value')).val()
    const all = Object.values(privateData) as Array<PlayerPrivateData>
    await this.atomic((story: StoryData|null) => { return handler(story, all) })
  }

  public async finalize(): Promise<void> {
    /**
     * finalize function copies final data from private space
     * of players into the public space
     */
    const privateData = (await FirebaseSDK.DB.ref('players').child(this.data.id).once('value')).val()

    const src = Object.values(privateData) as Array<PlayerPrivateData>
    const tgt = {} as Record<string, PlayerStoryData>

    /* do not forget to remove private id of the players */
    for (const player of src) {
      const tplayer = {} as PlayerStoryData
      Object.assign(tplayer, player)
      delete tplayer['id']
      tgt[tplayer.key] = tplayer
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
  PlayerPrivateData as PlayerPrivateData,
  PlayerPublic as PlayerPublic,
  Story as Story,
  StoryData as StoryData,
  Contribution as Contribution,
  initializeCadex
}
