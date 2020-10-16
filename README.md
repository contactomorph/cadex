# Cadex README

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
firebase emulators:start --only functions,database
```

### (Re-)Compile
```
npm run build
```


## Notes / Bugs

* Bug with Babel / ESlint with module "links": https://cli.vuejs.org/guide/troubleshooting.html#symbolic-links-in-node-modules
