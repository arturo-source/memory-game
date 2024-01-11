<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  stats: Object,
  hasStarted: Boolean,
  hasWon: Boolean,
})

const timeElapsed = ref(0);
const startTime = ref(null);
const endTime = ref(null);

const recalculateTimeElapsed = () => {
    const now = props.hasWon ? endTime.value : new Date();

    timeElapsed.value = Math.round((now - startTime.value)/1000);
    setTimeout(recalculateTimeElapsed, 1000);
}

watch(() => props.hasStarted, () => {
    if(props.hasStarted) {
        startTime.value = new Date();
        recalculateTimeElapsed();
    }
});

watch(() => props.hasWon, () => {
    if(props.hasWon)
        endTime.value = new Date();
});
</script>

<template>
    <div>
        <span>Cards flipped: {{ props.stats.flips }}</span>
        <span>Failed: {{ props.stats.failed }}</span>
        <span>Time: {{ timeElapsed  }}</span>
    </div>
</template>

<style scoped>
div {
    margin-bottom: 12px;
}
span {
    margin-right: 12px;
}
</style>