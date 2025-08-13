module.exports = {
    content: [
        '**/**.svelte',
    ],
    safelist: [
      {
        pattern: /bg-(green|red|blue|yellow|purple|gray|orange)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /text-(green|red|blue|yellow|purple|gray|orange)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /border-(green|red|blue|yellow|purple|gray|orange)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    ],
  }