import { css } from "@mui/material";
import type { ConversionType } from "@slippi/slippi-js";
import _ from "lodash";
import React from "react";
import type { Game, GlobalStats } from "stats/stats";
import { getGamePlayerCodeIndex, getPlayerName } from "stats/stats";

import * as T from "@/containers/ReplayFileStats/TableStyles";
import { convertFrameCountToDurationString } from "@/lib/time";
import { getCharacterIcon } from "@/lib/utils";

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
        <T.TableCell>
          <div
            css={css`
              display: flex;
            `}
          >
            <div
              css={css`
                margin-left: auto;
                margin-right: 5px;
              `}
            >
              {damage}
            </div>
            <div
              css={css`
                margin-right: auto;
              `}
            >
              {damageRange}
            </div>
          </div>
        </T.TableCell>
        <T.TableCell>{punish.moves.length}</T.TableCell>
        <T.TableCell>{openingType}</T.TableCell>
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
          {isOpponent ? (
            <div
              css={css`
                margin-left: auto;
                margin-right: 10px;
              `}
            >
              {tag}
            </div>
          ) : null}
          <T.GrayableImage
            css={
              !isOpponent
                ? css`
                    margin: auto;
                  `
                : css`
                    margin-right: auto;
                  `
            }
            src={getCharacterIcon(p.characterId, p.characterColor)}
            height={24}
            width={24}
          />
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

  const renderHeaderColumns = () => {
    return (
      <T.TableRow>
        <T.TableHeaderCell style={{ textAlign: "center" }}>Character</T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }}>Opponent</T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }}>Damage</T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }}>Moves</T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }}>Opening</T.TableHeaderCell>
        <T.TableHeaderCell style={{ textAlign: "center" }} colSpan={2}>
          Time
        </T.TableHeaderCell>
      </T.TableRow>
    );
  };

  const renderPunishRows = () => {
    const diff = (p: ConversionType) => p.currentPercent - p.startPercent;
    return stats.punishes
      .sort((a, b) => diff(b.punish) - diff(a.punish))
      .slice(0, 15)
      .map((punish) => generatePunishRow(punish.game, punish.punish));
  };

  return (
    <T.Table>
      {renderHeaderColumns()}
      {renderPunishRows()}
    </T.Table>
  );
};