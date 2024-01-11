
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
            keepFlipped: false,
        };
    }
})();
  

export function shuffleCards() {
    let newCards = Array(4*4).fill().map(newCard);
    let currentIndex = newCards.length,  randomIndex;

    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [newCards[currentIndex], newCards[randomIndex]] = [newCards[randomIndex], newCards[currentIndex]];
    }

    return newCards;
}

export function flippedCardsAreTheSame(cards) {
    const cardsFlipped = cards.filter((c) => c.isFlipped && !c.keepFlipped);
    if (cardsFlipped.length !== 2) return {flippedCards: [], cardsAreEqual: false};

    const isSameFigure = cardsFlipped[0].figure === cardsFlipped[1].figure;
    return {flippedCards: cardsFlipped, cardsAreEqual: isSameFigure};
}