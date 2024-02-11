import { init, Model } from 'z3-solver';

import { describe, expect, it } from "vitest"

// This file is just copying some of the examples from https://microsoft.github.io/z3guide/programming/Z3%20JavaScript%20Examples/
// to ensure that Z3 is setup correctly

describe("#verify that Z3 is installed", () => {
  it("checks no x under 9 and above 10", async () => {
    const { Context } = await init();
    const Z3 = Context('main');

    const x = Z3.Int.const('x');
    const solver = new Z3.Solver();
    solver.add(x.ge(10), x.le(9));

    const sat = await solver.check();

    expect(sat).toBe("unsat");
  });

  it("Find 2 arrays of length 4 which are not identical but have the same sum", async () => {
    const { Context } = await init();
    const Z3 = Context('main');

    const { Array, BitVec } = Z3;
    // const mod = 1n << 32n;
    const arr1 = Array.const('arr', BitVec.sort(2), BitVec.sort(32));
    const arr2 = Array.const('arr2', BitVec.sort(2), BitVec.sort(32));
    const same_sum = arr1.select(0)
      .add(arr1.select(1))
      .add(arr1.select(2))
      .add(arr1.select(3))
      .eq(
        arr2.select(0)
          .add(arr2.select(1))
          .add(arr2.select(2))
          .add(arr2.select(3))
      );
    const different = arr1.select(0).neq(arr2.select(0))
      .or(arr1.select(1).neq(arr2.select(1)))
      .or(arr1.select(2).neq(arr2.select(2)))
      .or(arr1.select(3).neq(arr2.select(3)));

    const model = await Z3.solve(same_sum.and(different)) as Model;
    const arr1Vals = [0, 1, 2, 3].map(i => model.eval(arr1.select(i)).value());
    const arr2Vals = [0, 1, 2, 3].map(i => model.eval(arr2.select(i)).value());

    // let buffer = ""
    // for (let i = 0; i < 4; i++) {
    //     buffer += arr1Vals[i];
    //     buffer += " "
    // }
    // buffer += "\n";
    // for (let i = 0; i < 4; i++) {
    //     buffer += arr2Vals[i];
    //     buffer += " "
    // }
    // buffer += "\n";
    // buffer

    expect(arr1Vals.length).toBe(4);
    expect(arr2Vals.length).toBe(4);
    for (let i = 0; i < arr1Vals.length; i++) {
      expect(arr1Vals[i]).not.toBe(arr2Vals[i]);
    }

  });


  it("solve a hard coded sudoku", async () => {
    const { Context } = await init();
    const Z3 = Context('main');

    const INSTANCE = toSudoku(`
....94.3.
...51...7
.89....4.
......2.8
.6.2.1.5.
1.2......
.7....52.
9...65...
.4.97....
`);


    const cells = [];
    // 9x9 matrix of integer variables
    for (let i = 0; i < 9; i++) {
      const row = [];
      for (let j = 0; j < 9; j++) {
        row.push(Z3.Int.const(`x_${i}_${j}`));
      }
      cells.push(row);
    }

    const solver = new Z3.Solver();

    // each cell contains a value 1<=x<=9
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        solver.add(cells[i][j].ge(1), cells[i][j].le(9));
      }
    }

    // each row contains a digit only once
    for (let i = 0; i < 9; i++) {
      solver.add(Z3.Distinct(...cells[i]));
    }

    // each column contains a digit only once
    for (let j = 0; j < 9; j++) {
      const column = [];
      for (let i = 0; i < 9; i++) {
        column.push(cells[i][j]);
      }
      solver.add(Z3.Distinct(...column));
    }

    // each 3x3 contains a digit at most once
    for (let iSquare = 0; iSquare < 3; iSquare++) {
      for (let jSquare = 0; jSquare < 3; jSquare++) {
        const square = [];

        for (let i = iSquare * 3; i < iSquare * 3 + 3; i++) {
          for (let j = jSquare * 3; j < jSquare * 3 + 3; j++) {
            square.push(cells[i][j]);
          }
        }

        solver.add(Z3.Distinct(...square));
      }
    }

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const digit = INSTANCE[i][j];
        if (digit !== null) {
          solver.add(cells[i][j].eq(digit));
        }
      }
    }

    const is_sat = await solver.check(); // sat
    expect(is_sat).toBe("sat");
    const model = solver.model() as Model;
    let buffer = "";

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const v = model.eval(cells[i][j]);
        buffer += `${v}`;
      }
      buffer += "\n";
    }
    buffer

    const expected = `715894632
234516897
689723145
493657218
867231954
152489763
376148529
928365471
541972386
`;

    expect(buffer).toBe(expected);
  })



});

function toSudoku(data: string): (number | null)[][] {
  const cells: (number | null)[][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null));

  const lines = data.trim().split('\n');
  for (let row = 0; row < 9; row++) {
    const line = lines[row].trim();
    for (let col = 0; col < 9; col++) {
      const char = line[col];
      if (char !== '.') {
        cells[row][col] = Number.parseInt(char);
      }
    }
  }
  return cells;
}
