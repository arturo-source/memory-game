<script setup>
const emit = defineEmits(['cardFlipped'])
const props = defineProps({
  card: Object
})

const Figure = props.card.figure;

function flipCard() {
    if (props.card.keepFlipped) return;

    props.card.isFlipped = !props.card.isFlipped;
    emit("cardFlipped");
}
</script>

<template>
    <div :class="{card: true, flip: card.isFlipped, unflip: !card.isFlipped, rightPair: card.rightPair, wrongPair: card.wrongPair}" @click="flipCard">
        <Figure :class="{makeVisible: card.isFlipped, makeInvisible: !card.isFlipped}" />
    </div>
</template>