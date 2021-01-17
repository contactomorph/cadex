import * as functions from 'firebase-functions'
import { Player, PlayerPrivate, PlayerPrivateData, Story, StoryData, initializeCadex} from 'cadexlib'
import * as firebase from 'firebase-admin'
import { encode, decode, onCorsRequest, onStoryRequest } from './utils'

firebase.initializeApp()
initializeCadex(firebase.database())

console.log("Loaded...")


/**
 * Manage the story state, find the player, update status
 * Must be call in an atomic / transaction prevent bad data
 */
function updateStoryState(story: StoryData|null, privateData: Array<PlayerPrivateData>): StoryData|null {
  if (!story) {
    return story
  }

  const curr = story.players[story.currentPlayer]

  if (story.currentPlayer !== '' && !curr.played) {
    return story
  }

  /* finalize the turn of the current player */
  let tail = ''
  if (curr) {
    curr.myTurn = false
    if (!story.rounds) {
      story.rounds = new Array<string>()
    }
    story.rounds.push(curr.key)
    story.currentPlayer = ''

    const currPlayer = privateData.find((p) => (p.key === curr.key))
    if (currPlayer) {
      tail = currPlayer.tail || ''
    }
  }

  /* find a new available player */
  for (const [key, next] of Object.entries(story.players)) {
    if (!next.played) {
      story.players[key].myTurn = true
      story.currentPlayer = key
      story.players[key].continuation = encode(story.id, tail)
      break
    }
  }

  return story
}

/**
 * Copy the player state from story state to player private area
 */
exports.storyUpdated = functions.database.ref('/stories/{sid}').onUpdate(async (snapshot, ctx) => {
  const sid = ctx.params.sid
  const storyData = snapshot.after.val() as StoryData

  if (!storyData.players) {
    return
  }
  for (const [key, playerData] of Object.entries(storyData.players)) {
    const player = new PlayerPrivate(sid, decode(sid, key))
    playerData.ptail = playerData.continuation ? decode(sid, playerData.continuation) : ''
    await player.update(playerData)
  }
})

/**
 * Create a new story and the first player (admin)
 */
export const newStory = onCorsRequest(async (request, response) => {
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

  const adminKey = encode(sid, request.body.uid)

  await story.update({
    admin: adminKey
  }, true)

  const player = new Player(sid, request.body.uid, adminKey)
  await player.update({
    id: request.body.uid,
    name: request.body.name,
    color: request.body.color,
  }, true)

  await story.atomicUpdateWithPrivateData(updateStoryState)

  response.json({
    admin: player.toJSON(),
    story: story.toJSON()
  })
})

/**
 * Finalize a story (only for the admin)
 */
export const closeStory = onStoryRequest(true, async (story, request, response) => {
  await story.finalize()
  response.status(204).json({
    message: "Story closed"
  })
  return
})


/**
 * Join the story
 */
export const newPlayer = onStoryRequest(false, async (story, request, response) => {

  if (!request.body.name) {
    response.status(400).json({
      message: "name field is missing, you must define a player name"
    })
    return
  }

  const player = new Player(story.data.id, request.body.uid, encode(story.data.id, request.body.uid))
  await player.update({
    id: request.body.uid,
    name: request.body.name,
    color: request.body.color,
  }, true)

  await story.atomicUpdateWithPrivateData(updateStoryState)

  response.status(200).json(player.toJSON())
})

/**
 * Play on a story
 */
export const play = onStoryRequest(false, async (story, request, response) => {
  const player = new Player(story.data.id, request.body.uid, encode(story.data.id, request.body.uid))
  await player.load()

  if (!request.body.head || !request.body.tail) {
    response.status(400).json({
      message: "head and tail can not be undefined"
    })
    return
  }

  if (player.publicData.played) {
    response.status(401).json({
      message: "player already played"
    })
    return
  }

  await player.update({
    played: true,
    head: request.body.head,
    tail: request.body.tail,
  })

  await story.atomicUpdateWithPrivateData(updateStoryState)

  response.status(200).json({ message: 'ok' })
})

/**
 * Update player settable properties
 */

interface SettableProps {
  name?: string;
  color?: string;
}

export const updatePlayer = onStoryRequest(false, async(story, request, response) => {
  const player = new Player(story.data.id, request.body.uid, encode(story.data.id, request.body.uid))
  await player.load()

  const data:SettableProps = {}

  if(request.body.name) {
    data.name = request.body.name
  }

  if(request.body.color) {
    data.color = request.body.color
  }

  await player.update(data)

  response.status(200).json({ message: 'ok' })
})
