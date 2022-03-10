
const loginPaths = [
  `/login`,
]

export default function ({ app, redirect, route, store }) {
  if (loginPaths.includes(route.path) === false && store.state.loggedIn !== true) {
    console.log(`REDIRECT +++++++`)
    store.commit(`set`, { loginRedirect: route.fullPath })
    redirect(loginPaths[0])
  }
}
