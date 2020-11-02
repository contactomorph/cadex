import * as functions from 'firebase-functions'
import * as cors from 'cors'
import { Player, Story, PlayerOrder, initializeCadex} from 'cadexlib'
import * as firebase from 'firebase-admin'

firebase.initializeApp();
initializeCadex(firebase.database())

const corswrapper = cors({origin: true})

console.log("Loaded...")

exports.playerCreated = functions.database.ref('/players/{sid}/{uid}').onCreate(async (snapshot, ctx) => {
  const uid = ctx.params.uid
  const sid = ctx.params.sid

  const num = snapshot.val().num
  console.log("num", num)

  const story = new Story(sid)
  await story.load()

  if (story.data.currentPlayer !== num) {
    /* This is not my turn, do nothing */
    return
  }

  /* Else get back the previous tail */
  const playerOrder = new PlayerOrder(sid)

  await story.load()
  await playerOrder.load()

  const curr = new Player(sid, uid, num)
  const prev = playerOrder.who(num - 1)

  let ptail = ''
  if (prev) {
    await prev.load()
    ptail = prev.privateData.tail
  }

  /* And update myTurn */
  await curr.update({
    ptail: ptail,
    myTurn: true
  })

})

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

  const curr = new Player(sid, uid, num)
  const next = playerOrder.who(num + 1)

  /* Can not modify num */
  if (turnData.num !== num) {
    await curr.update({ num: num })
    return
  }

  /* But name can be modify */
  if (name !== turnData.name) {
    await curr.update({ name: turnData.name })
  }

  /* If it is not a play modification, quit */
  if (
      story.data.currentPlayer !== num ||
      !turnData.played ||
      story.data.players[num].played ||
      !playerOrder.who(num)
  ) {
    return
  }

  // Else update

  await curr.update({
    played: true,
    myTurn: false
  })

  if (next) {
    await next.update({
      ptail: turnData.tail,
      myTurn: true
    })
  }

  await story.update({currentPlayer: num + 1})

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
    const playerOrder = new PlayerOrder(sid)

    await story.update({
      currentPlayer: 0
    }, true)

    const player = new Player(sid, request.body.uid, 0)
    await player.update({
      id: request.body.uid,
      name: request.body.name,
      num: 0
    }, true)

    await playerOrder.register(0, request.body.uid)

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
    const playerOrder = new PlayerOrder(sid)
    await playerOrder.load()

    const player = playerOrder.who(0)

    if (!player || player.privateData.id !== request.body.uid) {
      response.status(403).end()
      return
    }

    const story = new Story(sid)
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
    const playerOrder = new PlayerOrder(request.body.storyId)
    await story.load()

    const num = story.data.players.length

    const player = new Player(story.data.id, request.body.uid, num)
    await player.update({
      id: request.body.uid,
      name: request.body.name,
      num: num
    }, true)

    await playerOrder.register(num, player.privateData.id)

    response.json(player.toJSON())
  })
})
