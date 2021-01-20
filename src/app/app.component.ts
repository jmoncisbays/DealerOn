import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormGroupDirective, NgForm, Validators } from "@angular/forms";
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IPositionHeading } from './models/i-position-heading';
import { IExplorationGridBounds } from './models/i-exploration-grid-bounds';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent implements OnInit {
  commandsForm: FormGroup;
  updatedPositions: IPositionHeading[];

  constructor(private _snackBar: MatSnackBar) {}

  ngOnInit() {
    this.commandsForm  = new FormGroup({
      'commands': new FormControl('', [
        Validators.required
      ])
    });
  }

  executeCommands() {
    this.updatedPositions = [];

    // --no need to check if there are no Commands since the form validates that--

    let commands: string[] = this.commandsControl.value.toString().split(/[\r\n]+/);
    
    // number of commands must be an odd number
    if (commands.length == 1 || commands.length % 2 == 0) {
      this._snackBar.open("The commands are not valid");
      return;
    }

    // exploration grid bounds
    let arrExpGrdBounds: string[] = commands[0].split(" ");

    if (arrExpGrdBounds.length != 2) {
      this._snackBar.open("The exploration grid bounds are not valid");
      return;
    }

    if (isNaN(+arrExpGrdBounds[0]) || isNaN(+arrExpGrdBounds[1])) {
      this._snackBar.open("The exploration grid bounds are not valid");
      return;
    }

    const expGrdBounds: IExplorationGridBounds = <IExplorationGridBounds> {x: +arrExpGrdBounds[0], y: +arrExpGrdBounds[1]};
    let roverIndex: number = 1;
    let arrPositionHeading: string[];
    let positionHeading: IPositionHeading;
    let instructions: string;
    for(let cmdLn: number = 1; cmdLn < commands.length; cmdLn += 2) {
      // position and heading
      arrPositionHeading = commands[cmdLn].split(" ");
      
      if (arrPositionHeading.length != 3) {
        this._snackBar.open(`The number of parameters for the position and heading for rover #${roverIndex} are not valid`);
        return;
      }

      if (isNaN(+arrPositionHeading[0]) || isNaN(+arrPositionHeading[1])) {
        this._snackBar.open(`The values of the coordinates of the position for rover #${roverIndex} are not valid`);
        return;
      }

      if ("NESW".includes(arrPositionHeading[2].toString().toUpperCase()) == false) {
        this._snackBar.open(`The heading value for rover #${roverIndex} is not valid`);
        return;
      }

      positionHeading = <IPositionHeading> { x: +arrPositionHeading[0], y: +arrPositionHeading[1], heading:arrPositionHeading[2].toString().toUpperCase() };

      if (positionHeading.x > expGrdBounds.x || positionHeading.y > expGrdBounds.y) {
        this._snackBar.open(`The current position of rover #${roverIndex} is out of the exploration grid bounds`);
        return;
      }

      // instructions
      instructions = commands[cmdLn + 1].toUpperCase();
      for(let i = 0; i < instructions.length; i++) {
        if ("LMR".includes(instructions.substr(i, 1)) == false) {
          this._snackBar.open(`The instructions for rover #${roverIndex} are not valid`);
          return;  
        }
      }
      
      try {
        this.updatedPositions.push(this.processRoverCommands(positionHeading, instructions, expGrdBounds, roverIndex));
      }
      catch(ex) {
        this._snackBar.open(ex);
        return;
      }

      roverIndex++;
    }
    
    this._snackBar.open("All commands were executed successfully");

  }

  processRoverCommands(positionHeading: IPositionHeading, instructions: string, explorationGridBounds: IExplorationGridBounds, roverNumber: number): IPositionHeading {
    let x: number = positionHeading.x;
    let y: number = positionHeading.y;
    let heading: number;

    switch(positionHeading.heading) {
      case "N":
        heading = 0;
        break;
      case "E":
        heading = 1;
        break;
      case "S":
        heading = 2;
        break;
      case "W":
        heading = 3;
        break;
    }

    for(let i = 0; i < instructions.length; i++) {
      switch(instructions.substr(i, 1)) {
        case "L":
          if (heading == 0) {
            heading = 3;
          }
          else {
            heading--;
          }
          break;
        case "R":
          if (heading == 3) {
            heading = 0;
          }
          else {
            heading++;
          }
          break;
        case "M":
          if (heading == 0) y++;
          if (heading == 1) x++;
          if (heading == 2) y--;
          if (heading == 3) x--;
          break;
        }
    }

    // ? out of exploration grid bounds
    if (x > explorationGridBounds.x || y > explorationGridBounds.y) throwError(`The instructions for rover #${roverNumber} were not valid: its final position would be out of the boundaries`);

    return <IPositionHeading> {x: x, y: y, heading: (heading == 0 ? "N" : (heading == 1 ? "E" : (heading == 2 ? "S" : "W")))};
  }

  get commandsControl() { return this.commandsForm.get("commands"); }

}

class SearchErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}