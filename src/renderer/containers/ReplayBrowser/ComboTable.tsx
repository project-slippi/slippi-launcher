import { css } from "@mui/material";
import type { Game, GlobalStats } from "@replays/stats";
import { getGamePlayerCodeIndex, getPlayerName } from "@replays/stats";
import type { ConversionType } from "@slippi/slippi-js";
import _ from "lodash";
import React from "react";

import { convertFrameCountToDurationString } from "@/lib/time";
import { getCharacterIcon } from "@/lib/utils";

import * as T from "../ReplayFileStats/TableStyles";

const columnCount = 8;

export const ComboTable: React.FC<{ player: string; stats: GlobalStats }> = ({ player, stats }) => {
  const generatePunishRow = (game: Game, punish: ConversionType) => {
    const start = convertFrameCountToDurationString(punish.startFrame);
    let end = "-";
    const damage = renderDamageCell(punish);
    const damageRange = renderDamageRangeCell(punish);
    const openingType = renderOpeningTypeCell(punish);

    if (punish.endFrame != null) {
      end = convertFrameCountToDurationString(punish.endFrame);
    }

    return (
      <T.TableRow
        style={{ textAlign: "center" }}
        key={`${game.fullPath}-${punish.playerIndex}-punish-${punish.startFrame}`}
      >
        <T.TableCell>{getPlayerCard(game, false)}</T.TableCell>
        <T.TableCell>{getPlayerCard(game, true)}</T.TableCell>
        <T.TableCell>{openingType}</T.TableCell>
        <T.TableCell>{damage}</T.TableCell>
        <T.TableCell>{damageRange}</T.TableCell>
        <T.TableCell>{punish.moves.length}</T.TableCell>
        <T.TableCell>{start}</T.TableCell>
        <T.TableCell>{end}</T.TableCell>
      </T.TableRow>
    );
  };

  const getPlayerCard = (game: Game, isOpponent: boolean) => {
    let index = getGamePlayerCodeIndex(game, player);
    if (isOpponent) {
      index = 1 - index;
    }
    const tag = getPlayerName(game, index);
    const players = game.settings.players || [];
    const playersByIndex = _.keyBy(players, "playerIndex");
    const p = playersByIndex[index];

    return (
      <div style={{ alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <T.GrayableImage
            css={
              !isOpponent
                ? css`
                    margin: auto;
                  `
                : css`
                    margin-left: auto;
                  `
            }
            src={getCharacterIcon(p.characterId, p.characterColor)}
            height={24}
            width={24}
          />
          {isOpponent ? (
            <div
              css={css`
                margin-right: auto;
              `}
            >
              {tag}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderDamageCell = (punish: ConversionType) => {
    const difference = punish.currentPercent - punish.startPercent;

    let diffColor = "green";
    if (difference >= 70) {
      diffColor = "red";
    } else if (difference >= 35) {
      diffColor = "yellow";
    }

    const diffDisplay = `${Math.trunc(difference)}%`;

    return <div style={{ textAlign: "center", color: diffColor }}>{diffDisplay}</div>;
  };

  const renderDamageRangeCell = (punish: ConversionType) => {
    return (
      <div style={{ textAlign: "center" }}>{`(${Math.trunc(punish.startPercent)}% - ${Math.trunc(
        punish.currentPercent,
      )}%)`}</div>
    );
  };

  const renderOpeningTypeCell = (punish: ConversionType) => {
    const textTranslation = {
      "counter-attack": "Counter Hit",
      "neutral-win": "Neutral",
      trade: "Trade",
    };

    return <div style={{ textAlign: "center" }}>{textTranslation[punish.openingType]}</div>;
  };

  const renderHeaderTitle = () => {
    return (
      <T.TableRow>
        <T.TableHeaderCell colSpan={columnCount}>Top Punishes</T.TableHeaderCell>
      </T.TableRow>
    );
  };

  const renderHeaderColumns = () => {
    return (
      <T.TableRow>
        <T.TableHeaderCell style={{ textAlign: "center" }}>P</T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }}>Opponent</T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }}>Opening</T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }} colSpan={2}>
          Damage
        </T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }}>Moves</T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }}>Start</T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }}>End</T.TableHeaderCell>
      </T.TableRow>
    );
  };

  const renderPunishRows = () => {
    const diff = (p: ConversionType) => p.currentPercent - p.startPercent;
    return stats.punishes
      .sort((a, b) => diff(b.punish) - diff(a.punish))
      .slice(0, 19)
      .map((punish) => generatePunishRow(punish.game, punish.punish));
  };

  return (
    <T.Table>
      {renderHeaderTitle()}
      {renderHeaderColumns()}
      {renderPunishRows()}
    </T.Table>
  );
};
