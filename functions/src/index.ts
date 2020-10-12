import * as functions from 'firebase-functions'
import * as cors from 'cors'
import { Player, Story, PlayerOrder} from './cadex'
import * as firebase from 'firebase-admin'

firebase.initializeApp();
const corswrapper = cors({origin: true})

exports.registeringUpdate = functions.database.ref('/players/{sid}').onUpdate(async (snapshot, ctx) => {
  const sid = ctx.params.sid
  const story = new Story(sid)
  const playerOrder = new PlayerOrder(sid)
  const chunks = snapshot.after.val()

  await story.load()

  /* Registering */
  if (story.data.registering) {
    /* Check number of player and set registering false if everybody is here */
    if (Object.keys(chunks).length == story.data.playerNumber) {
      await playerOrder.load()
      await story.update({
        registering : false,
        currentPlayer: 1
      })

      await (new Player(sid, playerOrder.who(1), 1)).update({ myTurn: true })
    }
  }

  return false
})


// Chunk Update
exports.chunkUpdate = functions.database.ref('/players/{sid}/{uid}').onUpdate(async (snapshot, ctx) => {
  const uid = ctx.params.uid
  const sid = ctx.params.sid
  const turnData = snapshot.after.val()
  const num = snapshot.before.val().num
  const name = snapshot.before.val().name
  const story = new Story(sid)
  const playerOrder = new PlayerOrder(sid)

  await story.load()
  await playerOrder.load()

  if (turnData.num != num) {
    snapshot.before.ref.update({
      num: num
    })
    return false
  }

  const player = new Player(sid, uid, num)

  if (name !== turnData.name) {
    await player.update({ name: turnData.name })
  }

  if (
    story.data.registering ||
      story.data.currentPlayer !== num ||
      !turnData.played ||
      story.data.players[num].played ||
      !playerOrder.who(num)
  ) {
    return false
  }

  await player.update({
    played: true,
    myTurn: false
  })

  if (num < story.data.playerNumber) {
    const next = playerOrder.who(num + 1)
    await (new Player(sid, next, num + 1)).update({
      ptail: turnData.tail,
      myTurn: true
    })

    await story.update({currentPlayer: num + 1})

  } else {
    await story.finalize()
  }

  return true
})

export const newStory = functions.https.onRequest((request, response) => {
  corswrapper(request, response, async () => {
    if (request.method !== 'POST') {
      response.status(404).end()
      return
    }

    if (!request.body.players) {
      response.status(400).end()
      return
    }

    const story = new Story()
    story.data.playerNumber = request.body.players
    await story.save()

    response.json(story.toJSON())
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
    const playerOrder = new PlayerOrder(request.body.storyId)
    await story.load()

    if (!story.data.registering) {
      response.status(403).end()
      return
    }

    const num = story.data.currentPlayer + 1
    const player = new Player(story.data.id, request.body.uid, num)
    await (player).update({
      id: request.body.uid,
      name: request.body.name,
      num: num
    }, true)

    await story.update({currentPlayer: num})
    await playerOrder.register(num, player.privateData.id)

    response.json(player.toJSON())
  })
})
