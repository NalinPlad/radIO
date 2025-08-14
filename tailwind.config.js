module.exports = {
    content: [
        '**/**.svelte',
    ],
    safelist: [
      {
          pattern: /(bg|text|border)-(green|red|blue|yellow|purple|gray|orange)-(50|100|200|300|400|500|600|700|800|900)/,
      },
    ],
  }