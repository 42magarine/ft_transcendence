// var message:string = "Hello World";
// console.log(message);


// class Greeting {
//     greet():void {
//         console.log("Hello World!!!")
//     }
// }
// var obj = new Greeting();
// obj.greet();


// var a: number = 10;
// function printNumber(num: number) {
//     console.log(num);
// }
// printNumber(a);


// interface IPerson {
//     firstName: string;
//     lastName: string;
//     getFullName(): string;
// }

// let obj: IPerson = {
//     firstName: "John",
//     lastName: "Doe",
//     getFullName(): string {
//         return this.firstName + " " + this.lastName;
//     }
// }
// console.log(obj.getFullName());


// // Base class
// class Person {
//     name: string;

//     constructor(name: string) {
//         this.name = name;
//     }

//     display(): void {
//         console.log(`Name: ${this.name}`);
//     }

//     greet(): void {
//         console.log(`Hello, ${this.name}!`);
//     }
// }

// // Derived class
// class Employee extends Person {
//     empCode: number;

//     constructor(name: string, code: number) {
//         super(name);    // Call the parent class constructor
//         this.empCode = code;
//     }

//     show(): void {
//        console.log(`Employee Code: ${this.empCode}`);
//     }

//     // Overriding and extending the greet() method
//     greet(): void {
//         super.greet();  // Call the 'greet()' method from the Person class
//         console.log(`Welcome to the company, ${this.name}.`);
//     }
// }

// let emp: Employee = new Employee("John", 123);
// emp.display();
// emp.show();
// emp.greet();


// let a: number | string = 10;
// // Type Guard
// if (typeof a === 'number') {
//     console.log('a is a number');
// }
// else {
//     console.log('a is a string');
// }


// var str = '1'
// var str2:number = <number> <any> str   //str is now of type number
// console.log(typeof(str2))

// Function scoped (global, class or function)
// var animal: string = "cat";
// if (true) {
//     var animal: string = "dog";
//     console.log(animal);
// }
// console.log(animal);


// // Block scoped
// let animal: string = "cat";
// if (true) {
//     let animal: string = "dog";
//     console.log(animal);
// }
// console.log(animal);


// let first_name: string = 'John';
// let last_name: string = "Doe";
// // let full_name: string = `${first_name} ${last_name}`;
// let full_name: string = first_name + " " + last_name;
// console.log(full_name);


// let numbers: number[] = [1, 2, 3];
// let numbers2: Array<number> = [1, 2, 3];
// console.log(numbers);
// console.log(numbers2);

// let a = 5;
// let b = 6;
// let a = "test";
// let b = "test";

// function add(a, b) {
//     return a + b;
// }

// let result = add(a, b);
// console.log(result);

// let test = [5, 10, "test"];
// test[0] = "qwe";
// console.log(test);

// let test2: [number, number, string];
//


// window.onmousedown = function (mouseEvent) {
//     console.log(mouseEvent.button);
// }


// let a = 5;
// let b = 6;

// function add (x: number, y: number) {
//     return x + y;
// }
// let result = add(a,b);

// const add = (x: number, y: number): number => x + y;
// let result = add(a,b);
