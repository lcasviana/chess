import { ChangeDetectionStrategy, Component, ViewEncapsulation } from "@angular/core";

import { ChessBoardComponent } from "./chess-board.component";
import { ChessCapturedComponent } from "./chess-captured.component";
import { ChessEndComponent } from "./chess-end.component";
import { ChessStartComponent } from "./chess-start.component";

@Component({
  selector: "chess-game",
  template: `
    <div class="relative grid size-full place-content-center place-items-center overflow-auto">
      <chess-start />
      <chess-end />
      <chess-board />
      <chess-captured />
    </div>
  `,
  host: { class: "contents" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ChessBoardComponent, ChessCapturedComponent, ChessEndComponent, ChessStartComponent],
})
export class ChessGameComponent {}
