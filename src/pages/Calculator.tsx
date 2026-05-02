import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const buttons = [
  ["C", "+/-", "%", "/"],
  ["7", "8", "9", "*"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

const isOperator = (value: string) => ["+", "-", "*", "/"].includes(value);

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const fontSizeClass = useMemo(() => {
    if (display.length > 12) return "text-2xl";
    if (display.length > 9) return "text-3xl";
    return "text-4xl";
  }, [display]);

  const inputNumber = (num: string) => {
    if (waitingForNext) {
      setDisplay(num);
      setWaitingForNext(false);
      return;
    }
    setDisplay((prev) => (prev === "0" ? num : prev + num));
  };

  const inputDecimal = () => {
    if (waitingForNext) {
      setDisplay("0.");
      setWaitingForNext(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay((prev) => prev + ".");
    }
  };

  const clearAll = () => {
    setDisplay("0");
    setPrevious(null);
    setOperator(null);
    setWaitingForNext(false);
  };

  const toggleSign = () => {
    if (display === "0") return;
    setDisplay((prev) => (prev.startsWith("-") ? prev.slice(1) : `-${prev}`));
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const calculate = (first: number, second: number, op: string) => {
    switch (op) {
      case "+":
        return first + second;
      case "-":
        return first - second;
      case "*":
        return first * second;
      case "/":
        return second === 0 ? NaN : first / second;
      default:
        return second;
    }
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previous === null) {
      setPrevious(inputValue);
    } else if (operator && !waitingForNext) {
      const result = calculate(previous, inputValue, operator);
      if (!Number.isFinite(result)) {
        setDisplay("Error");
        setPrevious(null);
        setOperator(null);
        setWaitingForNext(true);
        return;
      }
      setDisplay(String(result));
      setPrevious(result);
    }

    setOperator(nextOperator);
    setWaitingForNext(true);
  };

  const handleEquals = () => {
    if (operator === null || previous === null || waitingForNext) return;
    const current = parseFloat(display);
    const result = calculate(previous, current, operator);

    if (!Number.isFinite(result)) {
      setDisplay("Error");
      setPrevious(null);
      setOperator(null);
      setWaitingForNext(true);
      return;
    }

    setDisplay(String(result));
    setPrevious(null);
    setOperator(null);
    setWaitingForNext(true);
  };

  const handlePress = (value: string) => {
    if (/^\d$/.test(value)) {
      inputNumber(value);
      return;
    }

    if (value === ".") {
      inputDecimal();
      return;
    }

    if (value === "C") {
      clearAll();
      return;
    }

    if (value === "+/-") {
      toggleSign();
      return;
    }

    if (value === "%") {
      percentage();
      return;
    }

    if (value === "=") {
      handleEquals();
      return;
    }

    if (isOperator(value)) {
      handleOperator(value);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Calculator</h1>
        <p className="text-muted-foreground mt-2">Normal calculator module for quick calculations.</p>
      </div>

      <Card className="max-w-2xl mx-auto shadow-elegant">
        <CardHeader>
          <CardTitle className="text-2xl">Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-muted p-6 text-right overflow-hidden min-h-32 flex flex-col justify-between">
            <p className="text-sm text-muted-foreground text-left">
              {operator ? `Operator: ${operator}` : "Operator: None"}
            </p>
            <p className={`${fontSizeClass} font-semibold leading-tight break-all`}>{display}</p>
          </div>

          <div className="grid gap-2">
            {buttons.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-2">
                {row.map((button) => {
                  const isZero = button === "0" && rowIndex === 4;
                  const isEqual = button === "=";
                  const op = isOperator(button);

                  return (
                    <Button
                      key={button}
                      type="button"
                      variant={isEqual ? "default" : op ? "secondary" : "outline"}
                      className={`h-20 text-2xl ${isZero ? "col-span-2" : "col-span-1"}`}
                      onClick={() => handlePress(button)}
                    >
                      {button}
                    </Button>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
