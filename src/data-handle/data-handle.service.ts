import { Inject, Injectable } from "@nestjs/common";
import { HistoryTypes } from "../constants/history-constants";

@Injectable()
export class DataHandleService {
  constructor(
    @Inject(HistoryTypes) private readonly constants: HistoryTypes
  ) {}

  validateFileType(sections: string[]): string {
    let pokerSite = 'not recognized';

    // Reading first 3 lines
    const lines = sections[0].trim().split('\n').slice(0, 3);

    // Regex for each poker site
    const eightPokerregex = /^(\*{5} 888poker)(?=.+)/;
    const betOnlinePokerRegex = /BetOnline Hand #(\d+)/;
    const ggpRegex = /Poker Hand #TM\d{10}: Tournament #\d{8}/;
    const ignitionPoker = /Ignition Hand #\d{10}:/;
    const acrRegex = /^Game Hand #[0-9]+ - Tournament #[0-9]+ - Holdem\(No Limit\) - Level [0-9]+ \([\d.]+\/[\d.]+\)- [\d/]+ [\d:]+ [A-Za-z]+/
    const partyPokerRegex = /^\*\*\*\*\* Hand History For Game [A-Za-z0-9]+ \*\*\*\*\*/
    const pokerStarRegex = /^PokerStars Hand #[0-9]+:  Hold'em No Limit /i
    const iPokerRegex = /^GAME #[0-9]+ Version:[\d.]+ Uncalled:[YN] Texas Hold'em NL  Tournament/

    // Reading first 2 lines
    const line1 = lines[0];
    const line2 = lines[1];

    if (eightPokerregex.test(line1) || eightPokerregex.test(line2)) {
      pokerSite = this.constants.poker888;
      return pokerSite
    }

    if (betOnlinePokerRegex.test(line1) || betOnlinePokerRegex.test(line2)) {
      pokerSite = this.constants.chico;
      return pokerSite
    }

    if (ggpRegex.test(line1) || ggpRegex.test(line2)) {
      pokerSite = this.constants.ggPoker;
      return pokerSite
    }

    if (ignitionPoker.test(line1) || ignitionPoker.test(line2)) {
      pokerSite = this.constants.ignitionPoker;
      return pokerSite
    }

    if (acrRegex.test(line1) || acrRegex.test(line2)) {
      pokerSite = this.constants.acr;
      return pokerSite
    }

    if (partyPokerRegex.test(line1) || partyPokerRegex.test(line2)) {
      pokerSite = this.constants.partyPoker;
      return pokerSite
    }

    if ((line1.includes("PokerStars Hand")) ||
      (line2.includes("PokerStars Hand") )) {
      pokerSite = this.constants.pokerStars;
      return pokerSite
    }

    if (iPokerRegex.test(line1) || iPokerRegex.test(line2)) {
      pokerSite = this.constants.iPoker;
      return pokerSite
    }

    return 'not recognized'
  }

  eightPokerParser(sections: string[]): string[] {
    const data = []

    // check for each hands
    for (const section of sections) {
      const lines = section.split('\n');
      let lineData = this.eightPokerSectionParser(lines)
      data.push(lineData)
    }

    return data
  }

  eightPokerSectionParser(chunk: string[]) {
    let handHistory: any = {};
    handHistory.players = [];
    handHistory.actions = [];
    handHistory.summary = {};
    handHistory.summary.shows = []
    handHistory.summary.collected = []
    handHistory.summary.mucks = []
    handHistory.summary.notShow = []

    for (let line of chunk) {

      // Identify game Id
      const gameIDRegex = /Game (\d+)/;
      const gameIDMatch = line.match(gameIDRegex);
      if (gameIDMatch) {
        handHistory.gameId = parseInt(gameIDMatch[1]);
      }

      // Tournament ID and Buy-in
      const tournamentRegex = /Tournament #(\d+) \$(\d+) \+/;
      const tournamentMatch = line.match(tournamentRegex);
      if (tournamentMatch) {
        handHistory.tournamentID = parseInt(tournamentMatch[1]);
        handHistory.buyIn = parseFloat(tournamentMatch[2]);
      }

      // Blinds
      const blindsRegex = /(\d+\/\d+) Blinds/;
      const blindsMatch = line.match(blindsRegex);
      if (blindsMatch) {
        handHistory.blinds = blindsMatch[1];
      }

      // Table Number, Max Players, and Real Money
      const tableRegex = /Table #(\d+) (\d+) Max \((\w+)/;
      const tableMatch = line.match(tableRegex);
      if (tableMatch) {
        handHistory.tableNumber = parseInt(tableMatch[1]);
        handHistory.maxPlayers = parseInt(tableMatch[2]);
        handHistory.isRealMoney = tableMatch[3] === 'Real';
      }

      const playerInfoRegex = /Seat (\d+): (\w+) \(\s*([\d,]+)\s*\)/;
      const match = line.match(playerInfoRegex);
      if (match) {
        const seatNumber = match[1];
        const playerName = match[2];
        const chipCount = match[3].replace(/,/g, '');

        const player = {
          seatNumber: parseInt(seatNumber),
          playerName: playerName,
          chipCount: parseInt(chipCount)
        };
        handHistory.players.push(player);
      }

      // Antes, Small Blind, and Big Blind
      const anteRegex = /posts ante \[(\d+)\]/;
      const smallBlindRegex = /posts small blind \[(\d+)\]/;
      const bigBlindRegex = /posts big blind \[(\d+)\]/;
      const anteMatch = line.match(anteRegex);
      const smallBlindMatch = line.match(smallBlindRegex);
      const bigBlindMatch = line.match(bigBlindRegex);
      if (anteMatch) {
        handHistory.antes = parseInt(anteMatch[1]);
      }
      if (smallBlindMatch) {
        handHistory.smallBlind = parseInt(smallBlindMatch[1]);
      }
      if (bigBlindMatch) {
        handHistory.bigBlind = parseInt(bigBlindMatch[1]);
      }

      const cardsRegex = /\[ ([2-9TJQKA][csdh]), ([2-9TJQKA][csdh]) \]/;
      const handMatch = line.match(cardsRegex);
      if (handMatch) {
        const card1: any = handMatch[1].match(/([2-9TJQKA])([csdh])/);
        const card2: any = handMatch[2].match(/([2-9TJQKA])([csdh])/);

        handHistory.handCards = [
          { rank: card1[1], suit: card1[2] },
          { rank: card2[1], suit: card2[2] }
        ];
      }

      // Community cards
      const communityCardsRegex = /\*\* Dealing flop \*\* \[ ([2-9TJQKAcsdh]+), ([2-9TJQKAcsdh]+), ([2-9TJQKAcsdh]+) \]/;
      const matchcard = line.match(communityCardsRegex);
      if (matchcard) {
        const card1: any = matchcard[1].match(/([2-9TJQKA])([csdh])/);
        const card2: any = matchcard[2].match(/([2-9TJQKA])([csdh])/);
        const card3: any = matchcard[3].match(/([2-9TJQKA])([csdh])/);

        handHistory.communityCards = [
          { rank: card1[1], suit: card1[2] },
          { rank: card2[1], suit: card2[2] },
          { rank: card3[1], suit: card3[2] }
        ];
      }

      // Actions
      const actionRegex = /(\w+) (posts ante|posts small blind|posts big blind|raises \[\d+\]|calls \[\d+\]|checks|folds)/g;
      let actionMatch;
      while ((actionMatch = actionRegex.exec(line)) !== null) {
        handHistory.actions.push({
          playerName: actionMatch[1],
          action: actionMatch[2]
        });
      }

      // check for shows in summary
      const showRegex = /(.+) shows \[ ([2-9TJQKA][cdhs]), ([2-9TJQKA][cdhs]) \]/;
      const matchShow = line.match(showRegex);
      if (matchShow) {
        const player = matchShow[1];
        const rank1 = matchShow[2][0];
        const suit1 = matchShow[2][1];
        const rank2 = matchShow[3][0];
        const suit2 = matchShow[3][1];

        handHistory.summary.shows.push({
          player: player,
          cards: [
            { rank: rank1, suit: suit1 },
            { rank: rank2, suit: suit2 }
          ]
        });

      }

      // check for mucks in summary
      const muckRegex = /(.+) mucks \[ ([2-9TJQKA][cdhs]), ([2-9TJQKA][cdhs]) \]/;
      const matchMuck = line.match(muckRegex);
      if (matchMuck) {
        const player = matchMuck[1];
        const rank1 = matchMuck[2][0];
        const suit1 = matchMuck[2][1];
        const rank2 = matchMuck[3][0];
        const suit2 = matchMuck[3][1];

        handHistory.summary.mucks.push({
          player: player,
          cards: [
            { rank: rank1, suit: suit1 },
            { rank: rank2, suit: suit2 }
          ]
        });

      }

      // collected
      const collectRegex = /(\w+)\scollected\s\[\s([\d,]+)\s\]/;
      const matchCollect = line.match(collectRegex);

      if (matchCollect) {
        const player = matchCollect[1];
        const amount = matchCollect[2].replace(/,/g, "");
        handHistory.summary.collected.push(
          {
            "player": player,
            "amount": amount
          }
        )

      }

      //not shows
      // console.log(line)

      const notShowRegex = /^(\w+) did not show his hand/;
      const notShowMatch = line.match(notShowRegex);


      if (notShowMatch) {
        handHistory.summary.notShow.push(
          {
            "player": notShowMatch[1]
          }
        )
      }


    }

    return handHistory
  }

  pokerStarParser(sections: string[]): string[] {
    const data = []

    // check for each hands
    for (const section of sections) {
      const lines = section.split('\n');
      let lineData = this.pokerStarSectionParser(lines)
      data.push(lineData)
    }

    return data
  }

  pokerStarSectionParser(chunk: string[]) {
    let handHistory: any = {};
    handHistory.players = [];
    handHistory.playerSummary = [];

    const handNumberRegex = /Hand #(\d+)/;
    const tournamentNumberRegex = /Tournament #(\d+)/;
    const dateRegex = /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/;
    const buttonSeatRegex = /Seat #(\d+)/;
    const playerRegex = /Seat (\d+): (.+) \((\d+) in chips\)/;
    const holeCardsRegex = /Dealt to (.+) \[(.+)\]/;
    const flopRegex = /\*\*\* FLOP \*\*\* \[(.+)\]/;
    const turnRegex = /\*\*\* TURN \*\*\* \[(.+)\] \[(.+)\]/;
    const riverRegex = /\*\*\* RIVER \*\*\* \[(.+)\] \[(.+)\]/;
    const showDownRegex = /(.+): shows \[(.+)\] \((.+)\)/;
    const summaryRegex = /Total pot (\d+) \| Rake (\d+)/;
    const boardRegex = /Board \[(.+)\]/;
    const playerSummaryRegex = /Seat (\d+): (.+) \((.+)\) (.+)/;

    for (let line of chunk) {
      // Extract hand number
      const handNumber = handNumberRegex.exec(line);
      if (handNumber) {
        handHistory.handNumber = handNumber[1];
      }

      // tournament ID
      const tournamentID = tournamentNumberRegex.exec(line);
      let parsedHand = {}
      if (tournamentID) {
        handHistory.tournamentID = tournamentID[1];
      }

      // date regex
      const date = dateRegex.exec(line);
      if (date) {
        handHistory.date = date[1];
      }

      // players
      const players = line.match(new RegExp(playerRegex, "g"));
      if (players) {
        players.forEach((player: any) => {
          const [, seat, name, chips]: any = playerRegex.exec(player);
          handHistory.players.push({ seat, name, chips });
        });
      }

      // Extract hole cards
      const holeCards = holeCardsRegex.exec(line);
      if (holeCards) {
        handHistory.holeCards = {
          player: holeCards[1],
          cards: holeCards[2].split(" "),
        };
      }

      // Extract player summary
      const playerSummaryRegex = /Seat (\d+): (.+) \((.+)\) (.+)/;
      const playerSummary = line.match(new RegExp(playerSummaryRegex, "g"));
      if (playerSummary) {
        playerSummary.forEach((player: any) => {
          const [, seat, name, action, summary]: any = playerSummaryRegex.exec(player);
          handHistory.playerSummary.push({ seat, name, action, summary });
        });
      }

      // Extract button seat
      const buttonSeat = buttonSeatRegex.exec(line);
      if (buttonSeat) {
        handHistory.buttonSeat = buttonSeat[1];
      }

      // Extract flop
      const flop = flopRegex.exec(line);
      if (flop) {
        handHistory.flop = flop[1].split(" ");
      }

      // Extract turn
      const turn = turnRegex.exec(line);
      if (turn) {
        handHistory.turn = {
          flop: turn[1].split(" "),
          card: turn[2],
        };
      }

      // Extract river
      const river = riverRegex.exec(line);
      if (river) {
        handHistory.river = {
          flop: river[1].split(" "),
          card: river[2],
        };
      }

      // Extract show down information
      const showDown = showDownRegex.exec(line);
      if (showDown) {
        handHistory.showDown = {
          player: showDown[1],
          cards: showDown[2].split(" "),
          handDescription: showDown[3],
        };
      }

      // Extract pot summary
      const summary = summaryRegex.exec(line);
      if (summary) {
        handHistory.pot = {
          totalPot: summary[1],
          rake: summary[2],
        };
      }

      // Extract board
      const board = boardRegex.exec(line);
      if (board) {
        handHistory.board = board[1].split(" ");
      }
    }

    return handHistory
  }
}
