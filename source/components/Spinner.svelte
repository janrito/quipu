<style>
@reference "../main.css";
.spinner {
  @apply py-20 text-center text-lg text-pink-400;
}

.spinner:after {
  animation: changeContent 1s linear infinite;
  display: block;
  content: "⠋";
}

@keyframes changeContent {
  10% {
    content: "⠙";
  }
  20% {
    content: "⠹";
  }
  30% {
    content: "⠸";
  }
  40% {
    content: "⠼";
  }
  50% {
    content: "⠴";
  }
  60% {
    content: "⠦";
  }
  70% {
    content: "⠧";
  }
  80% {
    content: "⠇";
  }
  90% {
    content: "⠏";
  }
}
</style>

<p class="spinner"></p>
