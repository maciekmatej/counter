<template>

    <section class="card" v-if="loaded">
        <h4>{{timer.date}} {{timer.time}}</h4>
        <div class="counter">
        <div class="timer-wrapper">
        <div class="base-timer">
          <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g class="base-timer__circle">
              <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45" />
              <path
                :id="`remaining-days-${index}`"
                stroke-dasharray="283"
                class="base-timer__path-remaining"
                d="
                  M 50, 50
                  m -45, 0
                  a 45,45 0 1,0 90,0
                  a 45,45 0 1,0 -90,0
                "
              ></path>
            </g>
          </svg>
          <span class="base-timer-label">
            {{days}}
          </span>
        </div>
          <span class="units-span">Days</span>
        </div>
        <div class="timer-wrapper">
        <div class="base-timer">
          <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g class="base-timer__circle">
              <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45" />
              <path
                :id="`remaining-hours-${index}`"
                stroke-dasharray="283"
                class="base-timer__path-remaining"
                d="
                  M 50, 50
                  m -45, 0
                  a 45,45 0 1,0 90,0
                  a 45,45 0 1,0 -90,0
                "
              ></path>
            </g>
          </svg>
          <span class="base-timer-label">
            {{hours}}
          </span>
        </div>
        <span class="units-span">Hours</span>
        </div>
        <div class="timer-wrapper">
        <div class="base-timer">
          <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g class="base-timer__circle">
              <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45" />
              <path
                :id="`remaining-minutes-${index}`"
                stroke-dasharray="283"
                class="base-timer__path-remaining"
                d="
                  M 50, 50
                  m -45, 0
                  a 45,45 0 1,0 90,0
                  a 45,45 0 1,0 -90,0
                "
              ></path>
            </g>
          </svg>
          <span class="base-timer-label">
            {{minutes}}
          </span>
        </div>
        <span class="units-span">Minutes</span>
        </div>
        <div class="timer-wrapper">
        <div class="base-timer">
          <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g class="base-timer__circle">
              <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45" />
              <path
                :id="`remaining-seconds-${index}`"
                stroke-dasharray="283"
                class="base-timer__path-remaining"
                d="
                  M 50, 50
                  m -45, 0
                  a 45,45 0 1,0 90,0
                  a 45,45 0 1,0 -90,0
                "
              ></path>
            </g>
          </svg>
          <span class="base-timer-label">
            {{seconds}}
          </span>
        </div>
        <span class="units-span">Seconds</span>
        </div>
        </div>
        <i id="close-btn" @click="this.$emit('remove', this.index)" class="fas fa-times-circle"></i>
    </section>
</template>

<script>
export default {
  data() {
    return {
      seconds: null,
      minutes: null,
      hours: null,
      days: null,
      loaded: false,
    };
  },
  props: {
    timer: Object,
    index: Number,
    formatDate: Function,
  },
  emits: ['remove'],
  methods: {
    formatNums(num) {
      return (num < 10 ? `0${num}` : num);
    },
    showRemainingTime() {
      const timer = setInterval(() => {
        const newDate = new Date(this.formatDate(this.timer));
        const presentDate = new Date();
        this.timeLeft = newDate.getTime() - presentDate.getTime();
        if (this.timeLeft < 0) {
          clearInterval(timer);
          this.$emit('remove', this.index);
          return;
        }
        this.days = Math.floor(this.timeLeft / this.countDays);
        this.hours = Math.floor((this.timeLeft % this.countDays) / this.countHours);
        this.minutes = Math.floor((this.timeLeft % this.countHours) / this.countMinutes);
        this.seconds = Math.floor((this.timeLeft % this.countMinutes) / this.countSeconds);
        this.loaded = true;
        this.setCircleDasharray(this.seconds, 'seconds', 60);
        this.setCircleDasharray(this.minutes, 'minutes', 60);
        this.setCircleDasharray(this.hours, 'hours', 24);
        this.setCircleDasharray(this.days, 'days', 365);
      }, 1000);
    },
    calculateTimeFraction(unit, cap) {
      return unit / cap;
    },
    setCircleDasharray(datePart, name, cap) {
      const dashArrayLength = 283;
      const circleDasharray = `${(
        this.calculateTimeFraction(datePart, cap) * dashArrayLength
      ).toFixed(0)} 283`;
      document
        .getElementById(`remaining-${name}-${this.index}`)
        .setAttribute('stroke-dasharray', circleDasharray);
    },
  },
  computed: {
    countSeconds() {
      return 1000;
    },
    countMinutes() {
      return this.countSeconds * 60;
    },
    countHours() {
      return this.countMinutes * 60;
    },
    countDays() {
      return this.countHours * 24;
    },

  },
  created() {
    this.showRemainingTime();
  },
};
</script>

<style>
.card {
    display: flex;
    flex-direction: column;
    margin: 10px;
    width: 13rem;
    max-width: 20rem;
    min-width: fit-content;
    padding: 2rem;
    font-size: 1.1rem;
    border-radius: 10px;
    background-color: rgb(143, 148, 173);
    box-shadow: 0 0 5px rgb(143, 146, 156);
}
.counter {
  display: flex;
}
.card-info {
    display: flex;
}
.timer-wrapper {
  margin: 0 20px
}
section{
  position: relative;
}
h4 {
  margin-top: 0.2rem;
  color: white;
}
#close-btn {
    color: rgb(95, 100, 145);
    margin-left: 10px;
    cursor: pointer;
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.4rem;
}
.base-timer {
  position: relative;
  height: 5rem;
  width: 5rem;
}
.base-timer-label {
  position: absolute;
  height: 5rem;
  width: 5rem;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 25px;
  font-weight: 800;
  color: white;
}

.base-timer__circle {
  fill: none;
  stroke: none;
}

.base-timer__path-elapsed {
  stroke-width: 9px;
  stroke: rgb(255, 255, 255);
}
.base-timer__path-remaining {
  color: #b2c96b;
  stroke-width: 10px;
  stroke-linecap: b;
  transform: rotate(90deg);
  transform-origin: center;
  transition: 1s linear all;
  stroke: currentColor;
}
.base-timer__svg {
  transform: scaleX(-1);
}
.units-span {
  display: block;
  margin-top: 10px;
}
@media screen and (max-width: 600px)  {
  .base-timer, .base-timer-label {
    height: 3rem;
    width: 3rem;
  }
}
@media screen and (max-width: 430px)  {
  .timer-wrapper{
    margin: 0 10px;
  }
  .units-span{
    font-size: 0.8rem;
    font-weight: 600;
  }
}
</style>
