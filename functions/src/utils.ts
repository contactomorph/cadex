import * as cors from 'cors'
import * as crypto from 'crypto'
import * as functions from 'firebase-functions'

import { Story } from 'cadexlib'

type Request = functions.https.Request
type Response = functions.Response<unknown>
type HandlerType = (req: Request, resp: Response) => void | Promise<void>

function encode(sid: string, msg: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', sid + "secretkey")
  let crypted = cipher.update(msg, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decode(sid: string, emsg: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', sid + "secretkey")
  let dec = decipher.update(emsg, 'hex', 'utf8')
  dec += decipher.final('utf8');
  return dec;
}

function onCorsRequest(handler: HandlerType): functions.HttpsFunction {
  const corswrapper = cors({origin: true})
  return functions.https.onRequest((req, resp) => {
    corswrapper(req, resp, async () => {
      await handler(req, resp)
    })
  })
}

type StoryHandlerType = (story: Story, req: Request, resp: Response) => (void | Promise<void>)

function onStoryRequest(restricted: boolean, handler: StoryHandlerType): functions.HttpsFunction {
  return onCorsRequest(async (request, response) => {
    const sid = request.body.storyId

    if (request.method !== 'POST') {
      response.status(404).json({
        message: "Only accept POST"
      })
      return
    }

    if(!sid) {
      response.status(400).json({
        message: "storyId field is missing"
      })
      return
    }

    if(!request.body.uid) {
      response.status(401).json({
        message: "uid field must be set"
      })
      return
    }

    const story = new Story(sid)
    await story.load()

    if (restricted && story.data.admin != encode(sid, request.body.uid)) {
      response.status(403).end()
      return
    }

    await handler(story, request, response)
  })
}


export {
  encode,
  decode,
  onCorsRequest,
  onStoryRequest
}
