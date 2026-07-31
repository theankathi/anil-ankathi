(function () {
  "use strict";

  const currentEl = document.getElementById("current");
  const historyEl = document.getElementById("history");
  const keysEl = document.querySelector(".keys");

  // Calculator state
  let current = "0";      // string being entered / shown
  let previous = null;    // stored operand (number)
  let operator = null;    // pending operator: + - * /
  let justEvaluated = false;

  const OP_SYMBOLS = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  function render() {
    currentEl.textContent = formatForDisplay(current);
    if (previous !== null && operator) {
      historyEl.textContent = `${formatForDisplay(String(previous))} ${OP_SYMBOLS[operator]}`;
    } else {
      historyEl.textContent = "";
    }
    highlightOperator();
  }

  // Add thousands separators to the integer part, keep the fraction as typed.
  function formatForDisplay(value) {
    if (value === "Error") return value;
    const negative = value.startsWith("-");
    const raw = negative ? value.slice(1) : value;
    const [intPart, fracPart] = raw.split(".");
    const grouped = Number(intPart).toLocaleString("en-US");
    let out = grouped;
    if (fracPart !== undefined) out += "." + fracPart;
    else if (raw.endsWith(".")) out += ".";
    return (negative ? "-" : "") + out;
  }

  function highlightOperator() {
    document.querySelectorAll(".key--operator").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        operator !== null && btn.dataset.operator === operator && !justEvaluated
      );
    });
  }

  function inputDigit(d) {
    if (justEvaluated) {
      current = d;
      justEvaluated = false;
    } else if (current === "0") {
      current = d;
    } else {
      current += d;
    }
    render();
  }

  function inputDecimal() {
    if (justEvaluated) {
      current = "0.";
      justEvaluated = false;
    } else if (!current.includes(".")) {
      current += ".";
    }
    render();
  }

  function chooseOperator(nextOp) {
    if (operator && previous !== null && !justEvaluated) {
      // Chain: evaluate what we have so far first.
      previous = compute(previous, parseFloat(current), operator);
      current = String(previous);
    } else {
      previous = parseFloat(current);
    }
    operator = nextOp;
    justEvaluated = false;
    current = "0";
    // Keep previous visible in history until next digit.
    currentEl.textContent = formatForDisplay(String(previous));
    historyEl.textContent = `${formatForDisplay(String(previous))} ${OP_SYMBOLS[operator]}`;
    highlightOperator();
  }

  function equals() {
    if (operator === null || previous === null) return;
    const result = compute(previous, parseFloat(current), operator);
    historyEl.textContent = `${formatForDisplay(String(previous))} ${OP_SYMBOLS[operator]} ${formatForDisplay(current)} =`;
    current = String(result);
    previous = null;
    operator = null;
    justEvaluated = true;
    currentEl.textContent = formatForDisplay(current);
    highlightOperator();
  }

  function compute(a, b, op) {
    let result;
    switch (op) {
      case "+": result = a + b; break;
      case "-": result = a - b; break;
      case "*": result = a * b; break;
      case "/":
        if (b === 0) return "Error";
        result = a / b;
        break;
      default: return b;
    }
    // Guard against floating point noise, keep it tidy.
    return Math.round((result + Number.EPSILON) * 1e10) / 1e10;
  }

  function clearAll() {
    current = "0";
    previous = null;
    operator = null;
    justEvaluated = false;
    render();
  }

  function toggleSign() {
    if (current === "0" || current === "Error") return;
    current = current.startsWith("-") ? current.slice(1) : "-" + current;
    render();
  }

  function percent() {
    if (current === "Error") return;
    current = String(parseFloat(current) / 100);
    justEvaluated = false;
    render();
  }

  function handleAction(action) {
    if (current === "Error" && action !== "clear") return;
    switch (action) {
      case "clear": clearAll(); break;
      case "sign": toggleSign(); break;
      case "percent": percent(); break;
      case "decimal": inputDecimal(); break;
      case "equals": equals(); break;
    }
  }

  // Click handling (event delegation)
  keysEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.digit !== undefined) {
      if (current === "Error") clearAll();
      inputDigit(btn.dataset.digit);
    } else if (btn.dataset.operator !== undefined) {
      if (current === "Error") return;
      chooseOperator(btn.dataset.operator);
    } else if (btn.dataset.action !== undefined) {
      handleAction(btn.dataset.action);
    }
  });

  // Keyboard support
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k >= "0" && k <= "9") { if (current === "Error") clearAll(); inputDigit(k); }
    else if (k === ".") handleAction("decimal");
    else if (k === "+" || k === "-" || k === "*" || k === "/") {
      if (current !== "Error") chooseOperator(k);
    }
    else if (k === "Enter" || k === "=") { e.preventDefault(); handleAction("equals"); }
    else if (k === "Escape") handleAction("clear");
    else if (k === "%") handleAction("percent");
    else if (k === "Backspace") backspace();
  });

  function backspace() {
    if (justEvaluated || current === "Error") { clearAll(); return; }
    current = current.length > 1 ? current.slice(0, -1) : "0";
    if (current === "-") current = "0";
    render();
  }

  render();
})();
