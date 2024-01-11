<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import Card from '@/components/Card.vue'
import LoginModal from './components/LoginModal.vue';
import Stats from "@/components/Stats.vue";
import { newCard, shuffleCards, flippedCardsAreTheSame } from "@/utils/cardFunctions.js";
import { isLogged, logout } from "@/utils/userFunctions.js";
import JSConfetti from 'js-confetti'

const cards = ref(Array(4*4).fill().map(newCard));
const isLoginModalOpen = ref(false);
const userIsLogged = ref(false);
const alreadyStarted = ref(false);
const gameStats = reactive({
  flips: 0,
  failed: 0,
});

onMounted(start);

const confetti = new JSConfetti();

function cardFlipped() {
  if (!alreadyStarted.value) {
    start();
    isLoginModalOpen.value = true;
    return;
  }

  gameStats.flips++;
  const {flippedCards, cardsAreEqual} = flippedCardsAreTheSame(cards.value);

  if (cardsAreEqual) {
    flippedCards.map(c => c.keepFlipped = true);
    setTimeout(() => flippedCards.map(c => c.rightPair = true), 1000);
  } else if (!cardsAreEqual && flippedCards.length === 2) {
    gameStats.failed++;
    setTimeout(() => {
      flippedCards.map(c => c.wrongPair = true)

      setTimeout(() => {
        flippedCards.map(c => {
          c.isFlipped = false;
          c.wrongPair = false;
        })
      }, 1000);
    }, 1000);
  }
}

function start() {
  isLogged().then(logged => {
    userIsLogged.value = logged;
    if (logged && !alreadyStarted.value) {
      cards.value = shuffleCards(cards.value);
      alreadyStarted.value = true;
    }
  })
}

function restart() {
  alreadyStarted.value = false;
  start();
}

function exit() {
  logout()
  userIsLogged.value = false;
  alreadyStarted.value = false;
}

function handleModalClosing() {
  isLoginModalOpen.value = false
  start();
}

const hasWon = computed(() => cards.value.every((c) => c.isFlipped && c.keepFlipped))
watch(hasWon, () => {
  if(hasWon && alreadyStarted.value)
    confetti.addConfetti()
});
</script>

<template>
  <LoginModal :open="isLoginModalOpen" @close="handleModalClosing"/>
  <Stats 
    :stats="gameStats"
    :has-won="hasWon"
    :has-started="alreadyStarted"
  />
  <main id="board">
    <Card 
      v-for="card in cards" 
      :card="card" 
      :key="card.id"
      @card-flipped="cardFlipped" />
  </main>
  <div>
    <button v-if="!isLoginModalOpen && !userIsLogged" @click="isLoginModalOpen = !isLoginModalOpen">Login or register</button>
    <button v-if="userIsLogged" @click="exit">Logout</button>
    <button v-if="hasWon" @click="restart">Restart</button>
  </div>
</template>

<style scoped>
div {
  margin-top: 12px;
}
button {
  margin-right: 12px;
}
</style>