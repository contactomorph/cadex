import requests

resp = requests.post(
    'http://localhost:5001/cadex-a057e/us-central1/newStory',
    json={
        "players": 2
    }
)


storyId = resp.json()['id']

resp = requests.post(
    'http://localhost:5001/cadex-a057e/us-central1/newPlayer',
    json={
        "storyId": storyId,
        "name": "aurelien1",
        "uid": "myuid1"
    }
)

resp = requests.post(
    'http://localhost:5001/cadex-a057e/us-central1/newPlayer',
    json={
        "storyId": storyId,
        "name": "aurelien2",
        "uid": "myuid2"
    }
)
