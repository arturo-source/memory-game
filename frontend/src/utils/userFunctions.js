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

    try {        
        const data = await resp.json();
        localStorage.setItem(AUTH_TOKEN_KEY, data.token)
    } catch {
        return { error: "Error registering. Try again." };
    }

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