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


interface IPerson {
    firstName: string;
    lastName: string;
    getFullName(): string;
}

let obj: IPerson = {
    firstName: "John",
    lastName: "Doe",
    getFullName(): string {
        return this.firstName + " " + this.lastName;
    }
}
console.log(obj.getFullName());
