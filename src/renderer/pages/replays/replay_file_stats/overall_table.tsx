import type { FileResult } from "@replays/types";
import type { RatioType, StatsType } from "@slippi/slippi-js";
import _ from "lodash";

import { getCharacterIcon } from "@/lib/utils";

import * as T from "./table_styles";

const columnCount = 5; // Unfortunately there is no way to specify a col span of "all" max cols there will be is 5

type OverallTableProps = {
  file: FileResult;
  stats: StatsType;
};

export const OverallTable = ({ file, stats }: OverallTableProps) => {
  //RENDER HELPERS
  const renderPlayerHeaders = () => {
    const tableHeaders = [];
    for (const p of file.game.players) {
      tableHeaders.push(
        <T.TableHeaderCell key={p.playerIndex}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={getCharacterIcon(p.characterId, p.characterColor)}
              height={24}
              width={24}
              style={{
                marginRight: 10,
              }}
            />
            <div style={{ fontWeight: 500 }}>{p.displayName || p.tag || `Player ${p.playerIndex + 1}`}</div>
          </div>
        </T.TableHeaderCell>,
      );
    }

    return (
      <thead>
        <T.TableRow>
          <T.TableHeaderCell />
          {tableHeaders}
        </T.TableRow>
      </thead>
    );
  };

  const renderMultiStatField = (
    header: string,
    arrPath: string | string[],
    fieldPaths: string | string[] | null,
    highlight?: (v: any[], ov: any[]) => boolean,
    valueMapper?: (a: any) => string,
    arrPathExtension?: string | string[],
  ) => {
    const key = `standard-field-${header}`;

    const arr = _.get(stats, arrPath) || [];
    const itemsByPlayer = arr; // _.keyBy(arr, "playerIndex");

    if (!arr || arr.length === 0) {
      return (
        <T.TableRow key={key}>
          <T.TableCell>{header}</T.TableCell>
          <T.TableCell>Doubles is not supported for this field</T.TableCell>
        </T.TableRow>
      );
    }
    const player1Item = arrPathExtension ? _.get(itemsByPlayer[0], arrPathExtension) : itemsByPlayer[0] || {};
    const player2Item = arrPathExtension ? _.get(itemsByPlayer[1], arrPathExtension) : itemsByPlayer[1] || {};
    const generateValues = (item: any) => {
      if (fieldPaths !== null) {
        return _.chain(item)
          .pick(fieldPaths)
          .toArray()
          .map((v) => (valueMapper ? valueMapper(v) : v))
          .value();
      }

      if (valueMapper) {
        return [valueMapper(item)];
      }

      return [item];
    };

    const p1Values = generateValues(player1Item);
    const p2Values = generateValues(player2Item);

    return (
      <T.TableRow key={key}>
        <T.TableCell>{header}</T.TableCell>
        <T.TableCell highlight={highlight && highlight(p1Values, p2Values)}>
          <div>{p1Values.join(" / ")}</div>
        </T.TableCell>
        <T.TableCell highlight={highlight && highlight(p2Values, p1Values)}>
          <div>{p2Values.join(" / ")}</div>
        </T.TableCell>
      </T.TableRow>
    );
  };

  const renderRatioStatField = (
    header: string,
    arrPath: string,
    fieldPath: string,
    ratioRenderer: (ratio: RatioType, oppRatio: RatioType) => JSX.Element,
  ) => {
    const arr = _.get(stats, arrPath) || [];
    const itemsByPlayer = arr; // _.keyBy(arr, "playerIndex");

    const player1Item = itemsByPlayer[0] || {};
    const player2Item = itemsByPlayer[1] || {};

    const displayRenderer = (firstPlayer: boolean) => {
      const item = firstPlayer ? player1Item : player2Item;
      const oppItem = firstPlayer ? player2Item : player1Item;

      const ratio = _.get(item, fieldPath);
      const oppRatio = _.get(oppItem, fieldPath);

      return ratioRenderer(ratio, oppRatio);
    };

    const key = `standard-field-${header.toLowerCase()}`;
    return (
      <T.TableRow key={key}>
        <T.TableCell>{header}</T.TableCell>
        {displayRenderer(true)}
        {displayRenderer(false)}
      </T.TableRow>
    );
  };

  const renderSimpleRatioField = (
    header: string,
    arrPath: string,
    fieldPath: string,
    highlightCondition: (a: number, b: number) => boolean,
  ) => {
    return renderRatioStatField(header, arrPath, fieldPath, (ratio: RatioType, oppRatio: RatioType) => {
      const playerRatio = _.get(ratio, "ratio", null);
      const oppRatioType = _.get(oppRatio, "ratio", null);

      if (playerRatio === null) {
        return (
          <T.TableCell>
            <div>N/A</div>
          </T.TableCell>
        );
      }
      const fixedPlayerRatio = playerRatio.toFixed(1);
      const fixedOppRatio = oppRatioType !== null ? oppRatioType.toFixed(1) : "Infinity";
      return (
        <T.TableCell highlight={highlightCondition(parseFloat(fixedPlayerRatio), parseFloat(fixedOppRatio))}>
          <div>{fixedPlayerRatio}</div>
        </T.TableCell>
      );
    });
  };

  const renderPercentFractionField = (
    header: string,
    arrPath: string,
    fieldPath: string,
    highlightCondition: (a: number, b: number) => boolean,
  ) => {
    return renderRatioStatField(header, arrPath, fieldPath, (ratio, oppRatio) => {
      const playerRatio = _.get(ratio, "ratio", null);
      const oppRatioType = _.get(oppRatio, "ratio", null);

      if (playerRatio === null || oppRatioType === null) {
        return (
          <T.TableCell>
            <div>N/A</div>
          </T.TableCell>
        );
      }
      const fixedPlayerRatio = playerRatio.toFixed(3);
      const fixedOppRatio = oppRatioType.toFixed(3);

      const playerCount = _.get(ratio, "count");
      const playerTotal = _.get(ratio, "total");

      return (
        <T.TableCell highlight={highlightCondition(parseFloat(fixedPlayerRatio), parseFloat(fixedOppRatio))}>
          <div>
            <div style={{ display: "inline-block", marginRight: "8px" }}>{Math.round(playerRatio * 1000) / 10}%</div>
            <div style={{ display: "inline-block" }}>
              ({playerCount} / {playerTotal})
            </div>
          </div>
        </T.TableCell>
      );
    });
  };

  const renderHigherSimpleRatioField = (header: string, field: string) => {
    return renderSimpleRatioField(header, "overall", field, (fixedPlayerRatio: number, fixedOppRatio: number) => {
      const oppIsNull = fixedPlayerRatio && Number.isNaN(fixedOppRatio);
      const isHigher = fixedPlayerRatio > fixedOppRatio;
      return oppIsNull || isHigher;
    });
  };

  const renderLowerSimpleRatioField = (header: string, field: string) => {
    return renderSimpleRatioField(header, "overall", field, (fixedPlayerRatio: number, fixedOppRatio: number) => {
      const oppIsNull = fixedPlayerRatio && Number.isNaN(fixedOppRatio);
      const isLower = fixedPlayerRatio < fixedOppRatio;
      return oppIsNull || isLower;
    });
  };

  const renderHigherPercentFractionField = (header: string, field: string) => {
    return renderPercentFractionField(header, "overall", field, (fixedPlayerRatio: number, fixedOppRatio: number) => {
      const oppIsNull = fixedPlayerRatio && Number.isNaN(fixedOppRatio);
      const isHigher = fixedPlayerRatio > fixedOppRatio;
      return oppIsNull || isHigher;
    });
  };

  const renderCountPercentField = (
    header: string,
    arrPath: string,
    fieldPath: string,
    highlightCondition: (a: number, b: number) => boolean,
  ) => {
    return renderRatioStatField(header, arrPath, fieldPath, (ratio: RatioType, oppRatio: RatioType) => {
      const playerCount = _.get(ratio, "count") || 0;
      const playerRatio = _.get(ratio, "ratio");

      const oppCount = _.get(oppRatio, "count") || 0;

      let secondaryDisplay = null;
      if (playerRatio !== null) {
        secondaryDisplay = <div style={{ display: "inline-block" }}>({Math.round(playerRatio * 100)}%)</div>;
      }

      return (
        <T.TableCell highlight={highlightCondition(playerCount, oppCount)}>
          <div>
            <div style={{ display: "inline-block", marginRight: "8px" }}>{playerCount}</div>
            {secondaryDisplay}
          </div>
        </T.TableCell>
      );
    });
  };

  const renderOpeningField = (header: string, field: string) => {
    return renderCountPercentField(header, "overall", field, (playerCount, oppCount) => playerCount > oppCount);
  };

  //
  // RENDER SECTIONS
  //
  const renderOffenseSection = () => {
    return [
      <thead key="offense-header">
        <tr>
          <T.TableSubHeaderCell colSpan={columnCount}>Offense</T.TableSubHeaderCell>
        </tr>
      </thead>,
      <tbody key="offense-body">
        {renderMultiStatField("Kills", "overall", "killCount", (v, ov) => v[0] > ov[0])}
        {renderMultiStatField(
          "Damage Done",
          "overall",
          "totalDamage",
          (v, ov) => Boolean(v[0]) && Boolean(ov[0]) && parseInt(v[0].toString(), 10) > parseInt(ov[0].toString(), 10),
          (v) => v.toFixed(1),
        )}
        {renderHigherPercentFractionField("Opening Conversion Rate", "successfulConversions")}
        {renderLowerSimpleRatioField("Openings / Kill", "openingsPerKill")}
        {renderHigherSimpleRatioField("Damage / Opening", "damagePerOpening")}
      </tbody>,
    ];
  };

  const renderDefenseSection = () => {
    return [
      <thead key="defense-header">
        <tr>
          <T.TableSubHeaderCell colSpan={columnCount}>Defense</T.TableSubHeaderCell>
        </tr>
      </thead>,
      <tbody key="defense-body">
        {renderMultiStatField("Actions (Roll / Air Dodge / Spot Dodge)", "actionCounts", [
          "rollCount",
          "airDodgeCount",
          "spotDodgeCount",
        ])}
      </tbody>,
    ];
  };

  const renderNeutralSection = () => {
    return [
      <thead key="neutral-header">
        <tr key="neutral-header">
          <T.TableSubHeaderCell colSpan={columnCount}>Neutral</T.TableSubHeaderCell>
        </tr>
      </thead>,
      <tbody key="neutral-body">
        {renderOpeningField("Neutral Wins", "neutralWinRatio")}
        {renderOpeningField("Counter Hits", "counterHitRatio")}
        {renderOpeningField("Beneficial Trades", "beneficialTradeRatio")}
        {renderMultiStatField("Actions (Wavedash / Waveland / Dash Dance / Ledgegrab)", "actionCounts", [
          "wavedashCount",
          "wavelandCount",
          "dashDanceCount",
          "ledgegrabCount",
        ])}
      </tbody>,
    ];
  };

  const renderGeneralSection = () => {
    return [
      <thead key="general-header">
        <tr>
          <T.TableSubHeaderCell colSpan={columnCount}>General</T.TableSubHeaderCell>
        </tr>
      </thead>,
      <tbody key="neutral-body">
        {renderHigherSimpleRatioField("Inputs / Minute", "inputsPerMinute")}
        {renderHigherSimpleRatioField("Digital Inputs / Minute", "digitalInputsPerMinute")}
        {renderMultiStatField(
          "L-Cancel Success Rate",
          "actionCounts",
          null,
          undefined,
          (val: any) => {
            if (!val) {
              return "N/A";
            }

            const { fail, success } = val;
            const total = success + fail;
            const rate = total === 0 ? 0 : (success / (success + fail)) * 100;
            return `${rate.toFixed(0)}% (${success} / ${total})`;
          },
          "lCancelCount",
        )}
      </tbody>,
    ];
  };

  return (
    <T.Table>
      {renderPlayerHeaders()}
      {renderOffenseSection()}
      {renderDefenseSection()}
      {renderNeutralSection()}
      {renderGeneralSection()}
    </T.Table>
  );
};
