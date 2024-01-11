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

<style scoped>
dialog {
    border-radius: 12px;
    margin: auto;
    width: 30%;
    background-color: white;
    z-index: 100;
}

@media (max-width:960px) {
  dialog {
    width: 90%;
  }
}

form {
    display: flex;
    flex-direction: column;
    padding: 16px;
}

label {
    margin-bottom: 8px;
}

input {
    width: 100%;
    padding: 8px;
    margin-bottom: 16px;
    border-radius: 12px;
}

button {
    background-color: #4caf50;
    color: white;
    padding: 10px;
    border: none;
    cursor: pointer;
    border-radius: 12px;
}

button:hover {
    background-color: #45a049;
}

a {
    padding-top: 12px;
    color: blue;
    cursor: pointer;
}

p.error {
    color: red;
}
</style>