<template>
  <div class="mode-wrapper">
    change mode

    <button
      :disabled="darkMode"
      @click="toggleDarkMode"
      class="modeBtn"
      :class="{ 'dark': darkMode, 'light': !darkMode }"
      type="button"
    >
      <i class="fas fa-moon"></i>
    </button>
    <button
      :disabled="!darkMode"
      @click="toggleDarkMode"
      class="modeBtn"
      :class="{ 'dark': !darkMode, 'light': darkMode }"
      type="button"
    >
      <i class="fas fa-sun"></i>
    </button>
  </div>
  <h1>Select a date to set the timer</h1>
  <form @submit.prevent="createCounter">
    <input
      @input="tabActive = true"
      v-model="newTimer.date"
      type="date"
      id="date"
      max=""
      required
    />
    <input
      @input="tabActive = true"
      v-model="newTimer.time"
      type="time"
      id="time"
      step="1"
      required
    />
    <button :disabled="showAlert" class="submit-btn button" type="submit">
      Add Timer
    </button>
    <div v-if="showAlert" class="alert">This date has already passed!</div>
  </form>

  <div class="container">
    <Counter
      v-for="(timer, index) in timers"
      :key="timer.id"
      :timer="timer"
      :index="index"
      @remove="remove"
      :formatDate="formatDate"
    />
  </div>
</template>

<script>
import Counter from './components/Counter.vue';

export default {
  name: 'App',
  data() {
    return {
      timers: [],
      newTimer: {
        date: '',
        time: '',
        id: '',
      },
      darkMode: false,
      tabActive: false,
      showAlert: false,
    };
  },
  components: {
    Counter,
  },
  methods: {
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      document.body.classList.toggle('dark-theme');
    },
    createCounter() {
      const currentDate = new Date();
      const newDate = new Date(this.formatDate(this.newTimer));
      if (newDate.getTime() < currentDate.getTime()) {
        this.showAlert = true;
        setTimeout(() => {
          this.showAlert = false;
        }, 2000);
        return;
      }
      if (this.newTimer.date !== '' && this.newTimer.time !== '') {
        const id = Math.floor(Math.random() * 1000);
        this.newTimer.id = id;
        this.timers.push(this.newTimer);
        this.newTimer = {};
        this.tabActive = false;
        this.setDate();
        localStorage.setItem('timers', JSON.stringify(this.timers));
      }
    },
    remove(index) {
      this.timers.splice(index, 1);
    },
    formatDate(el) {
      return `${el.date}T${el.time}`;
    },
    setDate() {
      const liveUpdate = setInterval(() => {
        if (this.tabActive === true) {
          clearInterval(liveUpdate);
          return;
        }
        const date = new Date();
        this.newTimer.date = date.toISOString().substring(0, 10);
        this.newTimer.time = date.toTimeString().substring(0, 8);
      }, 1000);
    },
  },
  computed: {},
  mounted() {
    this.setDate();
    const retrievedObject = localStorage.getItem('timers');
    if (retrievedObject) {
      this.timers = JSON.parse(retrievedObject);
      return;
    }
    this.timers = [];
  },
};
</script>

<style>
#app {
  font-family: "Roboto", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#date,
#time {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  box-shadow: 0 0 10px rgb(138, 136, 160);
  margin: 10px;
}
#date:hover,
#time:hover {
  box-shadow: 0 0 10px rgb(67, 68, 80);
}
.button {
  margin: 10px;
  border: none;
  font-size: 1.2rem;
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
}
.error-btn {
  background: none;
  font-size: 1.5rem;
  line-height: 50px;
}
.submit-btn {
  background-color: #8378c4;
  color: white;
}
.submit-btn:hover {
  background-color: #7059ad;
}
.modeBtn {
  font-size: 1.2rem;
  line-height: 1.2rem;
  background: none;
  padding: 10px;
  border: none;
  border-radius: 50%;
  margin: 0 5px;
  color: white;
  cursor: pointer;
}
.modeBtn i {
font-size: 1.4rem;
  line-height: 1.4rem;
}
.dark {
  background-color: rgb(18, 22, 65);
  border: 2px solid;
}
.light {
  background-color: rgb(255, 255, 255);
  color: black;
}

.container {
  padding-top: 5rem;
  margin: 0 auto;
  max-width: 80%;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.alert {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translate(-50%, 50%);
  color: rgb(170, 5, 5);
}
form {
  position: relative;
}
.mode-wrapper {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #4c6986;
  background: none;

}
@media screen and (max-width: 800px)  {
  #app {
    margin-top: 80px;
  }
}
@media screen and (max-width: 600px)  {
  .container {
    max-width: unset;
    width: 100%;
    min-width: 100%;
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: center ;
  }
  .card {
    padding: 10px;
  }

}
@media screen and (max-width: 440px)  {
  form {
    display: flex;
    flex-direction: column;
  }
  .container {
    padding-top: 2rem;
  }
  #app{
    min-width: 320px;
  }
}
</style>
