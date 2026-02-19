const UI_MINUS = '−';
const UI_MULTIPLY = '×';
const UI_DIVIDE = '÷';

type OperatorToken = '+' | '-' | '*' | '/';
type UnaryOperatorToken = 'u-';
type Token = number | OperatorToken;
type RpnToken = number | OperatorToken | UnaryOperatorToken;

const precedence: Record<OperatorToken | UnaryOperatorToken, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  'u-': 3,
};

const isRightAssociative = (token: OperatorToken | UnaryOperatorToken) => token === 'u-';
const isOperator = (token: string) => token === '+' || token === '-' || token === '*' || token === '/';

const normalizeExpression = (expression: string) =>
  expression
    .replaceAll(UI_MINUS, '-')
    .replaceAll(UI_MULTIPLY, '*')
    .replaceAll(UI_DIVIDE, '/')
    .replace(/\s+/g, '');

export const isInProgressExpression = (expression: string) => {
  const normalized = normalizeExpression(expression);
  if (!normalized) {
    return true;
  }

  const lastChar = normalized[normalized.length - 1];
  if (isOperator(lastChar) || lastChar === '(' || lastChar === '.') {
    return true;
  }

  if (normalized.includes('()') || normalized.endsWith('(')) {
    return true;
  }

  return false;
};

const tokenize = (expression: string): Token[] | null => {
  if (!expression) {
    return null;
  }

  const normalized = normalizeExpression(expression);
  const tokens: Token[] = [];

  let index = 0;
  while (index < normalized.length) {
    const char = normalized[index];

    if (isOperator(char)) {
      tokens.push(char as OperatorToken);
      index += 1;
      continue;
    }

    if (char === '.' || /\d/.test(char)) {
      let rawNumber = '';
      let dotCount = 0;

      while (index < normalized.length) {
        const numberChar = normalized[index];

        if (numberChar === '.') {
          dotCount += 1;
          if (dotCount > 1) {
            return null;
          }
          rawNumber += numberChar;
          index += 1;
          continue;
        }

        if (/\d/.test(numberChar)) {
          rawNumber += numberChar;
          index += 1;
          continue;
        }

        break;
      }

      if (rawNumber === '.') {
        return null;
      }

      const parsed = Number(rawNumber);
      if (!Number.isFinite(parsed)) {
        return null;
      }

      tokens.push(parsed);
      continue;
    }

    return null;
  }

  return tokens;
};

const toRpn = (tokens: Token[]): RpnToken[] | null => {
  const output: RpnToken[] = [];
  const stack: (OperatorToken | UnaryOperatorToken)[] = [];

  let prevToken: RpnToken | null = null;

  for (const token of tokens) {
    if (typeof token === 'number') {
      output.push(token);
      prevToken = token;
      continue;
    }

    let currentOperator: OperatorToken | UnaryOperatorToken = token;
    if (token === '-' && (prevToken === null || typeof prevToken !== 'number')) {
      currentOperator = 'u-';
    }

    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const higherPrecedence = precedence[top] > precedence[currentOperator];
      const equalPrecedence = precedence[top] === precedence[currentOperator];

      if (higherPrecedence || (equalPrecedence && !isRightAssociative(currentOperator))) {
        output.push(stack.pop() as OperatorToken | UnaryOperatorToken);
      } else {
        break;
      }
    }

    stack.push(currentOperator);
    prevToken = currentOperator;
  }

  while (stack.length > 0) {
    output.push(stack.pop() as OperatorToken | UnaryOperatorToken);
  }

  return output;
};

const evaluateRpn = (tokens: RpnToken[]): number | null => {
  const stack: number[] = [];

  for (const token of tokens) {
    if (typeof token === 'number') {
      stack.push(token);
      continue;
    }

    if (token === 'u-') {
      const value = stack.pop();
      if (value === undefined) {
        return null;
      }
      stack.push(-value);
      continue;
    }

    const right = stack.pop();
    const left = stack.pop();

    if (left === undefined || right === undefined) {
      return null;
    }

    let result: number;
    switch (token) {
      case '+':
        result = left + right;
        break;
      case '-':
        result = left - right;
        break;
      case '*':
        result = left * right;
        break;
      case '/':
        if (right === 0) {
          return null;
        }
        result = left / right;
        break;
      default:
        return null;
    }

    if (!Number.isFinite(result)) {
      return null;
    }

    stack.push(result);
  }

  if (stack.length !== 1) {
    return null;
  }

  return stack[0];
};

export const evaluateExpression = (expression: string): number | null => {
  const tokens = tokenize(expression);
  if (!tokens) {
    return null;
  }

  const rpn = toRpn(tokens);
  if (!rpn) {
    return null;
  }

  return evaluateRpn(rpn);
};

export const tryEvaluate = (expression: string): { ok: true; value: number } | { ok: false } => {
  if (isInProgressExpression(expression)) {
    return { ok: false };
  }

  const value = evaluateExpression(expression);
  if (value === null) {
    return { ok: false };
  }

  return { ok: true, value };
};

export const isCalculatorOperator = (token: string) =>
  token === '+' || token === UI_MINUS || token === UI_MULTIPLY || token === UI_DIVIDE;

export const getLastNumberSegment = (expression: string) => {
  const normalized = normalizeExpression(expression);
  const operators = ['+', '-', '*', '/'];

  for (let i = normalized.length - 1; i >= 0; i -= 1) {
    if (operators.includes(normalized[i])) {
      return normalized.slice(i + 1);
    }
  }

  return normalized;
};

export const formatExpressionValue = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (Object.is(value, -0)) {
    return '0';
  }

  const fixed = value.toFixed(10);
  const trimmed = fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  return trimmed === '' ? '0' : trimmed;
};
