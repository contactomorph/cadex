# Cadex README

## Behavior and vocabulary, variable names

* A game is a *story*
* A story is a succession of *turns*
* A turn is a succession of player *rounds*
* The story creator is the *administrator*
* When a story is created, it is in a *non-started* state
* The administrator should share the story url to invite the players
* The player should *register* to the story to be authorized to play
* The administrator is able to reorder (eventually randomly)
  players to define the turn order
* The administrator is able to *start* a story
* When administrator starts a story, its state is *started*
* Player can *play* when it is his turn by pushing a *contribution*
* A contribution is a pair of *head* and *tail* strings
* The head is private and the tail is given to the next player
* The next player is able to see the *ptail* (previous tail)
  before playing
* At every moment (?), a player can *update* his name and color
* The administrator is able to *stop* a story at every moment (?)
* The administrator is able to *skip* a player round
* The administrator is able to *ban* a player (?)
* When story is stopped, all contribution in the order is
  published to create the final story content


## CadexLib
It is required for backend AND frontend

### Compiles for production
```
cd commonlib
npm run build
```


## Frontend
Do not forget to compile CadexLib before use frontend

### Go to the subproject
```
cd frontend
```

### Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```


## Backend
Do not forget to compile CadexLib before use frontend

## Go to the subproject
```
cd backend
```

### Run backend / emulator
Run functions (backend logic) and a local database
```
firebase emulators:start --only "functions,database"
```

### (Re-)Compile
```
npm run build
```

### API & Hooks

* updateStoryState: the state function of the game
* storyUpdated: copy all "public" (story) data into "private" (player) space
* newStory: create a new story, set the current user as the administrator
* startStory: start the story
* closeStory: finalize the story
* newPlayer: player registration
* play: player push new contribution
* updatePlayer: player update its personnal data (name & color)


## Notes / Bugs

* Bug with Babel / ESlint with module "links": https://cli.vuejs.org/guide/troubleshooting.html#symbolic-links-in-node-modules
