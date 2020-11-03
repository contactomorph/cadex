import * as functions from 'firebase-functions'
import * as cors from 'cors'
import { Player, Story, initializeCadex} from 'cadexlib'
import * as firebase from 'firebase-admin'
import * as crypto from 'crypto'

firebase.initializeApp();
initializeCadex(firebase.database())

const corswrapper = cors({origin: true})

console.log("Loaded...")

function encodeUID(sid: string, uid: string): string {
  var cipher = crypto.createCipher('aes-256-cbc', sid + "secretkey")
  var crypted = cipher.update(uid,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decodeUID(sid: string, key: string): string {
  var decipher = crypto.createDecipher('aes-256-cbc', sid + "secretkey")
  var dec = decipher.update(key,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

exports.playerCreated = functions.database.ref('/players/{sid}/{uid}').onCreate(async (snapshot, ctx) => {
  const uid = ctx.params.uid
  const sid = ctx.params.sid

  const story = new Story(sid)
  await story.load()

  if (story.data.currentPlayer !== '') {
    return
  }

  const key = encodeUID(sid, uid)
  const curr = new Player(sid, uid, key)

  let ptail = ''

  if (story.data.lastPlayer) {
    const prevUid = decodeUID(sid, story.data.lastPlayer)
    const prev = new Player(sid, prevUid, story.data.lastPlayer)
    await prev.load()
    ptail = prev.privateData.tail
  }

  /* And update myTurn */
  await curr.update({
    ptail: ptail,
    myTurn: true
  })

  await story.update({
    currentPlayer: key
  })

})

exports.chunkUpdate = functions.database.ref('/players/{sid}/{uid}').onUpdate(async (snapshot, ctx) => {
  const uid = ctx.params.uid
  const sid = ctx.params.sid
  const turnData = snapshot.after.val()
  const name = snapshot.before.val().name
  const key = snapshot.before.val().key
  const ptail = snapshot.after.val().ptail
  const story = new Story(sid)

  await story.load()

  const curr = new Player(sid, uid, encodeUID(sid, uid))

  /* But name can be modify */
  if (name !== turnData.name) {
    await curr.update({ name: turnData.name })
  }

  /* If it is not a play modification, quit */
  const storyView = story.data.players[key]
  if (
      story.data.currentPlayer !== key||
      !turnData.played ||
      (storyView && storyView.played)
  ) {
    return
  }

  // Else update

  await curr.update({
    played: true,
    myTurn: false,
  })

  story.data.lastPlayer = curr.publicData.key
  story.data.rounds.push(curr.publicData.key)
  await story.save()

  /* Find a new player  TODO*/
  for (const [key, next] of Object.entries(story.data.players)) {
    if (!next.played && key !== curr.publicData.key) {
      const player = new Player(sid, decodeUID(sid, next.key), next.key)
      await player.update({
        ptail: ptail,
        myTurn: true
      })

      await story.update({
        currentPlayer: key
      })

      return
    }
  }

  await story.update({currentPlayer: ''})

  return
})

export const newStory = functions.https.onRequest((request, response) => {
  corswrapper(request, response, async () => {
    if (request.method !== 'POST') {
      response.status(404).end()
      return
    }

    if (!request.body.name || !request.body.uid) {
      response.status(400).end()
      return
    }

    const story = new Story()
    const sid = story.data.id

    const adminKey = encodeUID(sid, request.body.uid)

    await story.update({
      admin: adminKey
    }, true)

    const player = new Player(sid, request.body.uid, adminKey)
    await player.update({
      id: request.body.uid,
      name: request.body.name,
    }, true)

    response.json({
      admin: player.toJSON(),
      story: story.toJSON()
    })
  })
})

export const closeStory = functions.https.onRequest((request, response) => {
  corswrapper(request, response, async () => {
    if (request.method !== 'POST') {
      response.status(404).end()
      return
    }

    if (!request.body.storyId || !request.body.uid) {
      response.status(400).end()
      return
    }

    const sid = request.body.storyId
    const story = new Story(sid)

    await story.load()

    if (story.data.admin != encodeUID(sid, request.body.uid)) {
      response.status(403).end()
      return
    }

    await story.finalize()
    response.json({})
    return true
  })
})

export const newPlayer = functions.https.onRequest((request, response) => {
  corswrapper(request, response, async () => {
    if (request.method !== 'POST') {
      response.status(404).end()
      return
    }

    if (!request.body.name || !request.body.storyId || !request.body.uid) {
      response.status(400).end()
      return
    }

    const story = new Story(request.body.storyId)
    await story.load()

    const player = new Player(story.data.id, request.body.uid, encodeUID(story.data.id, request.body.uid))
    await player.update({
      id: request.body.uid,
      name: request.body.name,
    }, true)

    response.json(player.toJSON())
  })
})
