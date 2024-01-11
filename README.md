# Documentation about memory game creation

Ensure that you have installed `php` + `composer`, `node` + `npm` and `docker`. I will install them with `brew` from MacOS. I also will use `sqlitebrowser` to be able to see what's happening in the database.

## Test that app works with laravel/breeze

The project will use `sqlite` for the simplicity, and I won't have to configure a DB manager. Change `DB_CONNECTION=sqlite` in the `.env` file.

I will run `composer require laravel/breeze --dev`, so I can see a small app running (moreover I have user login and registration done with `laravel/breeze`).

Then install Vue dependencies running `php artisan breeze:install vue`.

Finally I run `npm run dev` and `php artisan migrate` commands, and it works perfectly. Now I am able to login and register.

## Create the backend without vue

Vue has to run in a different container, so first create `backend` and `frontend` folders, where the different containers will run. Then, install Laravel in the `backend` folder `composer create-project laravel/laravel backend`. On the other hand, install Vue in the `frontend` folder `npm create vue@latest`.

Of course, I'll use `sqlite` again for the database. But in this case I'll use `blade` instead of `inertia`, because it's the default way to do templates with Laravel, and I don't want to use Laravel as a frontend, just as a RESTful API. Again, install `breze` with `composer require laravel/breeze --dev` command. After that run `php artisan breeze:install blade` to have the user login/register interface. And at least, `npm run dev` for the Tailwind CSS compiling, and `php artisan migrate` for database creation.

Now I can create the frontend stuff, run `npm create vue@latest`, the name of the project will be `frontend`, as the folder name, and the other options I'll press `N`. I'll also modify the `vite.config.js` to serve the app in the `8080` port. Then, run `npm run dev` to see that all is working in the Vue app.

## Create the backend Dockerfile

Dockerfile follows the next steps:

- Use `php` image to expose the Laravel service.
- Expose port 80 to access from the frontend.
- Run `curl` command to install composer.
- Copy the directory to be able to run the app.
- Install dependencies with `composer`.
- Build the Tailwind CSS with `npm`.
- Start server.

```Dockerfile
FROM php:8.3-rc-alpine

WORKDIR /var/www/html
EXPOSE 80

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY . .

RUN composer install
RUN apk add --update npm
RUN npm install
RUN npm run build

CMD ["php","artisan","serve","--host=0.0.0.0"]
```

## Create the frontend Dockerfile

Dockerfile follows next steps:

- Use `node` image to expose the Vue service.
- Expose the port 8080 to access with the browser.
- Copy the directory to be able to run the app.
- Install dependencies with `npm`.
- Start server.

```Dockerfile
FROM node:20

WORKDIR /usr/src/app
EXPOSE 8080

COPY . .

RUN npm install

CMD ["npm", "run", "dev"]
```

## Connect the containers

We need a network to be able to communicate both containers. I'll use `docker compose` to manage the containers. Then, create a yml file with the configuration `docker-compose.yml`

```yml
version: '3'

services:
  backend:
    build: backend/Dockerfile
    restart: always
    ports:
      - 80:80

  frontend:
    build: frontend/Dockerfile
    restart: always
    ports:
      - 8080:8080
```

With that configuration I can build both containers with `docker compose build` command, and run them with `docker compose up -d`. And they will be exposed in `80` and `8080` as requested.

### Problen with Vue

After last steps I ran `docker compose up -d`, both containers went up, but I couldn't access to the Vue container. It was because you have to set up `host: true`. That should be the Vite configuration:

```js
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    watch: {
      usePolling: true,
    },
    host: true,
    port: 8080,
  }
})
```

Moreover, I don't have hot reloading when modifying Vue application, because the code inside the container is not changed if I don't build it, so I'll stop using the frontend Dockerfile, and I'll use directly the `node` image with my `frontend` folder in the `docker-compose.yml`. So the final docker compose file is:

```yml
version: '3'

services:
  backend:
    build: ./backend/
    restart: always
    ports:
      - 80:80

  frontend:
    image: node:20
    restart: always
    working_dir: /srv/app/
    ports:
      - 8080:8080
    volumes:
      - ./frontend/:/srv/app/
    command: sh -c "npm install && npm run dev"
```

## Start developing

I have decided to start programming the game interface, so you can deliver some results earlier. The app will have the `App.vue` where the main logic is executed. Also it will have `Card.vue` component, which represents a that which can be flipped. And there are 8 different icons inside `frontend/src/components/icons/`, because the game have 8 different pairs (16 cards).

The `App.vue` starts being something simple, a main where all Cards are rendered.

```vue
<script setup>
import { onMounted, ref } from 'vue';
import Card from '@/components/Card.vue'
import { newCard, shuffleCards, twoCardsAreTheSame } from "@/utils/cardFunctions.js";

const cards = ref(Array(4*4).fill().map(newCard));

onMounted(() => {
  cards.value = shuffleCards(cards.value);
});
</script>

<template>
  <main id="board">
    <Card v-for="card in cards" :card="card" :key="card.id" @card-flipped="twoCardsAreTheSame(cards)" />
  </main>
</template>
```

The `Card.vue` is a little bit more complicated, I defined a prop (which is the card structure), and an emit, to determine when a card wants to be flipped. Also have a `showFigure` ref, because I wanted the card to be shown a little bit latter, not just when the flipping animation starts.

```vue
<script setup>
import { ref } from 'vue';

const emit = defineEmits(['cardFlipped'])
const props = defineProps({
  card: Object
})

const Figure = props.card.figure;
const showFigure = ref(false);

function setFlippedAfterHalfSecond() {
    props.card.isFlipped = !props.card.isFlipped
    setTimeout(() => showFigure.value = !showFigure.value, 400);

    emit("cardFlipped")
}
</script>

<template>
    <div :class="{card: true, flip: card.isFlipped, unflip: !card.isFlipped}" @click="setFlippedAfterHalfSecond">
        <Figure v-show="showFigure" />
    </div>
</template>
```

The animation is made with CSS. I will do `showFigure` with CSS also in the future, but now, it works using the ref. There is some CSS to center the board, and some for the card style. There is an animation called flip and another one for unflip.

```css
body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  /* background-color: rgb(0, 15, 28); */
}

#board {
  display: grid;
  grid-template-columns: repeat(4, 100px);
  grid-gap: 10px;
  text-align: center;
}

.card {
  width: 100px;
  height: 100px;
  background-color: lightblue;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.flip {
  animation: flip 1s forwards;
}

.unflip {
  animation: unflip 1s forwards;
}

@keyframes flip {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(180deg);
  }
}

@keyframes unflip {
  0% {
    transform: rotateY(180deg);
  }
  50% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(0deg);
  }
}
```

And the last important code is card functions, to be able to follow the game logic. All of them are used in `App.vue`.

```js
import { markRaw } from 'vue';
import { FIGURES } from '@/utils/figures.js';

// a function that returns a function, newCar() is the function returned
// each time newCard() is executed, it returns a different card, with different id, but it repeats a card if necessary
export const newCard = (() => {
    let id = 0;
    const figureKeys = Object.keys(FIGURES);

    return () => {
        id++;

        return {
        id: id,
        figure: markRaw(FIGURES[figureKeys[id%figureKeys.length]]),
        isFlipped: false,
        };
    }
})();
  

export function shuffleCards(cards) {
    let newCards = [...cards]
    let currentIndex = newCards.length,  randomIndex;

    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [newCards[currentIndex], newCards[randomIndex]] = [newCards[randomIndex], newCards[currentIndex]];
    }

    return newCards;
}

export function twoCardsAreTheSame(cards) {
    const cardsFlipped = cards.filter((card) => card.isFlipped);
    if (cardsFlipped.length !== 2) return;

    const isSameFigure = cardsFlipped[0].figure === cardsFlipped[1].figure;
    console.log({isSameFigure})
    if (isSameFigure) {
        // todo: 
        // do an animation (from blue to green, and after a second, from green to blue), and freeze them
    } else {
        // todo: 
        // do an animation (from blue to red, and after a second, from red to blue), and flip them
    }
}
```

## Now continue with the backend code

We need user model, user migration, and a controller, to be able to register and login. But it's already done when you install Laravel. To be able to get tokens, and have protected routes, I decided to use `laravel/sanctum`. It gives me a RESTful API and generate tokens without using OAuth.

So the `routes/api.php` looks like that:

```php
  Route::post('/register', [AuthController::class, 'register']);

  Route::post('/login', [AuthController::class, 'login']);

  Route::middleware('auth:sanctum')->get('/is-logged', function (Request $request) {
      return response()->json(['message' => 'User is logged']);
  });

  Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
```

And I have coded this Controller to do the login, logout, and registration stuff:

```php
class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            $user = $request->user();
            $token = $user->createToken('auth-token')->plainTextToken;
    
            return response()->json(['token' => $token, 'user' => $user]);
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
```

Then you can up the service with `docker compose build`, to rebuild the laravel image, and then `docker compose up -d` to keep the backend and the frontend working as a deamons. To test that the backend is working (remember that it is running in port 80) you can perform a curl for registration `curl -i -X POST -H "Content-Type: application/json" -d '{"name":"John Doe","email":"john@example.com","password":"your_password"}' localhost/api/register`, and the same for the login `curl -i -X POST -H "Content-Type: application/json" -d '{"email":"john@example.com","password":"your_password"}' localhost/api/login`.

After that, I will connect the frontend with the backend using the JS fetch API.

## Connect the frontend with the backend

In the frontend project I have created a file for user communication with the backend in `src/utils/userFunctions.js`. It has everything needed for the communication.

```js
const BASE_URL = 'http://localhost:80/api';
const AUTH_TOKEN_KEY = "auth_token";

export async function register(name, email, password) {
    const resp = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: name,
            email: email,
            password: password
        }),
    })

    if (!resp.ok) return { error: "Error registering. Try again." };

    const data = await resp.json();
    localStorage.setItem(AUTH_TOKEN_KEY, data.token)

    return {};
}

export async function login(email, password) {
    const resp = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            password: password
        }),
    })

    if (!resp.ok) return { error: "Error login. Try again." };

    const data = await resp.json();
    localStorage.setItem(AUTH_TOKEN_KEY, data.token)

    return {};
}

export async function isLogged() {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return false;

    const resp = await fetch(`${BASE_URL}/is-logged`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem(AUTH_TOKEN_KEY),
        },
    })

    if (!resp.ok) return false;

    return true;
}

export async function logout() {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return false;

    const resp = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem(AUTH_TOKEN_KEY),
        },
    })

    if (!resp.ok) return false;

    localStorage.removeItem(AUTH_TOKEN_KEY);
    return true;
}
```

As you can see, the `BASE_URL` is where the backend is established. Then, all the functions perfom a fetch, thats why all of them are async, so I can use await to do the logic.

### The form for the user

Now we have the logic, but then we need the form to be able to use these functions. I have created in `src/components/LoginModal.vue` a modal where you can type your data. I wanted to be on the top of the game when someone tries to start, so I used a `<dialog>` which was added in 2022 to the browsers to perform that situation. I have used a lot of Vue built-in because it works very well with forms. 

```vue
<template>
    <dialog ref="dialog">
        <button @click.prevent="emit('close')">x</button>
        <form>
            <label v-if="!isLogin">Name:<input type="text" v-model="name"></label>
            <label>Email:<input type="email" v-model="email"></label>
            <label>Password:<input type="password" v-model="password"></label>
            <label v-if="!isLogin">Repeat password:<input type="password" v-model="repeatedPassword"></label>
            <button type="button" v-if="isLogin" @click.prevent="sendToLogin">Log in</button>
            <button type="button" v-else @click.prevent="sendToRegister">Register</button>

            <p class="error" v-if="errorMsg != ''">{{ errorMsg }}</p>
            <a @click.prevent="isLogin = !isLogin" v-if="isLogin">Don't you have an account? Click here to register.</a>
            <a @click.prevent="isLogin = !isLogin" v-else>Do you already have an account? Click here to login.</a>
        </form>
    </dialog>
</template>
```

And the script is used to send the data to the logic functions, close the modal when success, and notice when something has gone wrong.

```vue
<script setup>
import { ref, watch } from 'vue';
import { login, register } from "@/utils/userFunctions.js";

const props = defineProps({
  open: Boolean
})
const emit = defineEmits(['close']);

const dialog = ref(null);
watch(() => props.open, (isOpen) => {
    if (isOpen) {
        dialog.value.showModal();
    } else {
        dialog.value.close();
    }
});

const errorMsg = ref('');
const isLogin = ref(true);
const name = ref('');
const email = ref('');
const password = ref('');
const repeatedPassword = ref('');

function sendToLogin() {
    if(email.value === '' || password.value === '') {
        setErrorForTwoSeconds('All fields are required');
        return;
    }

    login(email.value, password.value)
        .then(resp => {
            if (!resp.error) {
                emit('close');
                return;
            }
            setErrorForTwoSeconds(resp.error);
        });
}

function sendToRegister() {
    if(email.value === '' || password.value === '' || name.value === '' || repeatedPassword.value === '') {
        setErrorForTwoSeconds('All fields are required');
        return;
    }
    if (password.value !== repeatedPassword.value) {
        setErrorForTwoSeconds('Both passwords must be the same');
        return;
    }

    register(name.value, email.value, password.value)
        .then(resp => {
            if (!resp.error) {
                emit('close');
                return;
            }

            errorMsg.value = resp.error;
            setErrorForTwoSeconds(resp.error);
        });
}

function setErrorForTwoSeconds(error) {
    errorMsg.value = error;

    setTimeout(() => {
        errorMsg.value = '';
    }, 2000);
}
</script>
```

## Make the game responsive

Before continue adding features I wanted to do the game responsive, it should be easy thanks to CSS. I have opened the `src/assets/main.css` in the frontend project, and I have use media queries to perform that.

```css
@media (max-width:960px) {
  .card {
    width: 65px;
    height: 65px;
  }
  #board{
    grid-template-columns: repeat(4, 65px);
  }
}
```

When the screen is smaller than 960px, I do the game smaller to be visible in smaller screens.

## Improve Card animation

The next step will be doing the animation, the user has to know if the pair is correct or not. The idea is to transform the card into green when it's right, and red when it's wrong. Coding it with CSS is the best idea, because you can write animation queries. I opened the `src/assets/main.css` again, and typed these animations for the flipping:

```css
.flip {
  animation: flip 1s forwards;
}

.unflip {
  animation: unflip 1s forwards;
}

@keyframes flip {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(180deg);
  }
}

@keyframes unflip {
  0% {
    transform: rotateY(180deg);
  }
  50% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(0deg);
  }
}
```

Also to make visible the figure when the card is semi-flipped:

```css
.makeVisible {
  animation: makeVisible 1s forwards;
}

.makeInvisible {
  animation: makeInvisible 1s forwards;
}

@keyframes makeVisible {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes makeInvisible {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}
```

At least, an animation turning into red or green:

```css
.rightPair {
  animation: rightPair 1s forwards;
}

.wrongPair {
  animation: wrongPair 1s forwards;
}

@keyframes rightPair {
  0%, 100% {
  }
  50% {
    background-color: rgb(119, 203, 119);
  }
}

@keyframes wrongPair {
  0%, 100% {
  }
  50% {
    background-color: rgb(234, 143, 143);
  }
}
```

Finally, using Vue I can add or quit these animations when the game logic requires that (`Card.vue` component).

```vue
<template>
    <div :class="{card: true, flip: card.isFlipped, unflip: !card.isFlipped, rightPair: card.rightPair, wrongPair: card.wrongPair}" @click="flipCard">
        <Figure :class="{makeVisible: card.isFlipped, makeInvisible: !card.isFlipped}" />
    </div>
</template>
```

## Victory message

I have to inform the user when the game is finished, so I decided to throw some confeti, instead, which seems funnier. The easiest way to do that is installing a dependency with npm `npm install js-confetti`. Also, I have to calculate when the user has won, it will be true if all the cards are flipped. Then I can use it in the code:

```js
import JSConfetti from 'js-confetti'

const confetti = new JSConfetti();
const hasWon = computed(() => cards.value.every((c) => c.isFlipped && c.keepFlipped))
watch(hasWon, () => {
  if(hasWon && alreadyStarted.value)
    confetti.addConfetti()
});
```