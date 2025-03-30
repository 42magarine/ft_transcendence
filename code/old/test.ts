
// function add (x: number, y: number): number {
//     return x + y;
// }

// let addNums = function (x: number, y: number): number {
//     return x + y;
// }

// let addFun: (x: number, y: number) => number = function (x: number, y: number): number {
//     return x + y;
// }

// const greet: (name: string) => string = (name) => {
//     return `Hello, ${name}!`;
// };

// const greet2 = (name: string) => {
//     return `Hello, ${name}!`;
// };

// let greet3: (name: string) => string;
// greet3 = (name) => {
//   return `Hello, ${name}!`;
// };

// let greet4: (name: string) => string;
// greet4 = (name) => `Hello, ${name}!`;


// function greet5 (fn: (s: string) => void): void {
//     fn ("Welcome to Tutorials Point!")
//  }

//  function myprint (str: string): string {
//     console.log(str);
//     return "test";
//  }

//  greet5(myprint);



// let myfunction: (x: number, y: number) => number;

// myfunction = (a, b) => {
//     return a + b;
// };

// let num = myfunction(5);

// console.log(num);


// function greet(name: string, age?: number): void {
//     if (typeof age === 'number') {
//       console.log(`You are ${age} years old.`);
//     }
//   }
//   greet('Shahid', 35);


//   let sum: number;
// const add = (a: number, b: number, c: number) => {
//   sum = a + b + c;
//   return sum;
// };
// let res = add(10, 30, 45);
// console.log("The result is: '${res}'" + res);


const numbers = [1, 2, 3, 4, 5];
const squaredNumbers = numbers.map(x => x * x + 2);
console.log(`Original array: ${numbers}`);
console.log(`Squared array: ${squaredNumbers}`);
