import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { reactSelectCustomFilterTheme } from "../../utils/reactSelectCustomFilterTheme";
import { WeaponMiniDisplay } from "../WeaponMiniDisplay";
import { toEnkaUrl } from "../../utils/helpers";
import ReactSelect from "react-select";
import "./style.scss";

type SubstatPriority = {
  calculation: {
    calculationId: string;
    name: string;
    short: string;
    weapon: {
      name: string;
      icon: string;
      substat: string;
      type: string;
      rarity: string;
      refinement: number;
    };
  };
  substats: {
    [substatName: string]: {
      result: number;
      newRank: number | string;
      oldRank: number | string;
    };
  };
};

type SubstatPriorityTableProps = {
  row: any;
  selectedCalculationId?: string;
};

export const SubstatPriorityTable: React.FC<SubstatPriorityTableProps> = ({
  row,
  selectedCalculationId,
}) => {
  const [selectedCalcId, setSelectedCalcId] = useState<string>(
    selectedCalculationId || ""
  );
  const [priorityData, setPriorityData] = useState<SubstatPriority[]>([]);
  const [show, setShow] = useState(false);
  const [relativeTo, setRelativeTo] = useState<string>("Base");

  const getSubstatPriority = async () => {
    const _uid = encodeURIComponent(row.uid);
    const calcDetailsURL = `/api/substatPriority/${_uid}/${row.characterId}`;
    const opts = {
      params: { type: row.type },
    };
    const { data } = await axios.get(calcDetailsURL, opts);
    setPriorityData(data.data);
  };

  useEffect(() => {
    getSubstatPriority();
  }, []);

  useEffect(() => {
    if (selectedCalculationId) {
      const noVariant = selectedCalculationId.slice(0, 10);
      setSelectedCalcId(noVariant);
    }
  }, [selectedCalculationId]);

  const handleSelectChange = (option: any) => {
    setSelectedCalcId(option.value);
  };

  const calcOptions = useMemo(
    () =>
      priorityData && priorityData.length > 0
        ? priorityData.map((_data) => {
            const calc = _data.calculation;
            const label = (
              <>
                <span className="react-select-custom-option">
                  <span className="for-dropdown">
                    <WeaponMiniDisplay
                      icon={toEnkaUrl(calc.weapon.icon)}
                      refinement={calc.weapon.refinement}
                    />
                    <div
                      style={{
                        width: 150,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {calc.weapon.name}
                    </div>
                    <div>{calc.name}</div>
                  </span>
                  <span className="for-pills">
                    <img src={toEnkaUrl(calc.weapon.icon)} />
                    {calc.weapon.name} - {calc.name}
                  </span>
                </span>
              </>
            );

            const rawLabel = `${_data.calculation.weapon.name} R${_data.calculation.weapon.refinement} ${_data.calculation.name}`;

            const thisOpt = {
              label,
              rawLabel,
              value: _data.calculation.calculationId,
            };

            return thisOpt;
          })
        : [],
    [priorityData]
  );

  const selectedOption = useMemo(() => {
    return calcOptions.find((d) => d.value === selectedCalcId);
  }, [selectedCalcId, priorityData, selectedCalcId]);

  const calcsSelection = useMemo(() => {
    return (
      <>
        <div
          className={`substat-priority-select-wrapper ${
            calcOptions.length === 0 ? "no-calcs" : ""
          }`}
        >
          <span className="substat-priority-select-label">
            Select leaderbnoard
          </span>
          <div className="substat-priority-select">
            <div className="react-select-calcs-wrapper">
              <ReactSelect
                isDisabled={calcOptions.length === 0}
                // isMulti
                options={calcOptions}
                menuPortalTarget={document.body}
                styles={reactSelectCustomFilterTheme}
                maxMenuHeight={450}
                menuPlacement="auto"
                getOptionValue={(option: any) => option.rawLabel}
                placeholder={
                  calcOptions.length === 0
                    ? "No leaderboards available"
                    : "Choose leaderboards"
                }
                value={selectedOption}
                defaultValue={selectedOption}
                onChange={(options) => {
                  if (!options) return;
                  handleSelectChange(options);
                }}
              />
            </div>
          </div>
        </div>
      </>
    );
  }, [priorityData, selectedOption]);

  const selectedPriorityData = useMemo(() => {
    return priorityData?.find(
      (x) => x.calculation.calculationId === selectedCalcId
    );
  }, [priorityData, selectedCalcId, selectedOption]);

  //
  //  HEADERS
  //
  const tableHeaders = useMemo(() => {
    if (!selectedPriorityData?.substats) return null;

    return ["Substat name", ...Object.keys(selectedPriorityData?.substats)].map(
      (name) => {
        const value = selectedPriorityData.substats?.[name]?.result;
        if (
          name !== "Crit RATE" &&
          name !== "Base" &&
          value === selectedPriorityData.substats["Base"].result
        )
          return null;

        return (
          <td
            key={name}
            className={"substat-clickable"}
            onClick={() => setRelativeTo(name)}
            style={{
              color: name === relativeTo ? "orange" : "",
            }}
          >
            {name}
          </td>
        );
      }
    );
  }, [priorityData, selectedPriorityData, selectedOption, relativeTo]);

  //
  //  RESULTS ROWS
  //
  const resultsTableRows = useMemo(() => {
    if (!selectedPriorityData?.substats) return null;

    const highestGainsNum = Math.max(
      ...Object.values(selectedPriorityData.substats).map((x) => x.result)
    );

    const highestPercentage =
      (highestGainsNum * 100) / selectedPriorityData.substats["Base"].result -
      100;

    return [
      "Leaderboard result",
      ...Object.keys(selectedPriorityData?.substats),
    ].map((name) => {
      const value = selectedPriorityData?.substats?.[name]?.result;
      if (!value) return <td key={name}>{name}</td>;
      if (
        name !== "Crit RATE" &&
        name !== "Base" &&
        value === selectedPriorityData.substats["Base"].result
      )
        return null;

      const relativeComparator = selectedPriorityData.substats["Base"].result;
      const relativeValue = (value * 100) / relativeComparator - 100;

      const revRGB = 255 - (relativeValue / highestPercentage) * 255;
      const cellStyle = {
        color: `rgba(${revRGB}, 255,${revRGB}, 1)`,
      };

      return (
        <td style={cellStyle} key={`${name}-val`}>
          {value.toFixed(0)}
        </td>
      );
    });
  }, [priorityData, selectedPriorityData, selectedOption]);

  //
  //  RANKINGS ROWS
  //
  // const rankingsTableRows = useMemo(() => {
  //   if (!selectedPriorityData?.substats) return null;

  //   const highestGainsNum = Math.max(
  //     ...Object.values(selectedPriorityData.substats).map((x) => x.result)
  //   );

  //   const highestPercentage =
  //     (highestGainsNum * 100) / selectedPriorityData.substats["Base"].result -
  //     100;

  //   return [
  //     "New leaderboard ranking",
  //     ...Object.keys(selectedPriorityData?.substats),
  //   ].map((name) => {
  //     const value = selectedPriorityData?.substats?.[name]?.result;
  //     if (!value) return <td key={name}>{name}</td>;
  //     if (
  //       name !== "Crit RATE" &&
  //       name !== "Base" &&
  //       value === selectedPriorityData.substats["Base"].result
  //     )
  //       return null;

  //     const relativeComparator = selectedPriorityData.substats["Base"].result;
  //     const relativeValue = (value * 100) / relativeComparator - 100;

  //     const revRGB = 255 - (relativeValue / highestPercentage) * 255;
  //     const cellStyle = {
  //       color: `rgba(${revRGB}, 255,${revRGB}, 1)`,
  //     };

  //     const newRank = selectedPriorityData?.substats?.[name]?.newRank;
  //     const oldRank = selectedPriorityData?.substats?.[name]?.oldRank;

  //     const _newRank = ("" + newRank)?.replace("~", "");
  //     const _oldRank = ("" + oldRank)?.replace("~", "");

  //     const _newVal = _newRank.startsWith("(")
  //       ? _newRank.slice(1, _newRank.length - 1)
  //       : _newRank;

  //     const _oldVal = _oldRank.startsWith("(")
  //       ? _oldRank.slice(1, _oldRank.length - 1)
  //       : _oldRank;

  //     const _new = +_newVal;
  //     const _old = +_oldVal;

  //     const _diff = _old - _new;

  //     return (
  //       <td style={cellStyle} key={`${name}-val`}>
  //         {newRank} {_diff === 0 ? "" : `(+${_diff})`}
  //       </td>
  //     );
  //   });
  // }, [priorityData, selectedPriorityData, selectedOption]);

  //
  //  DMG GAIN ROWS
  //
  const dmgGainTableRows = useMemo(() => {
    if (!selectedPriorityData?.substats) return null;

    const highestGainsNum = Math.max(
      ...Object.values(selectedPriorityData.substats).map((x) => x.result)
    );

    const highestPercentage =
      (highestGainsNum * 100) / selectedPriorityData.substats["Base"].result -
      100;

    return [
      "DMG/Result gain over base",
      ...Object.keys(selectedPriorityData?.substats),
    ].map((name) => {
      const value = selectedPriorityData?.substats?.[name]?.result;
      if (!value) return <td key={name}>{name}</td>;
      if (
        name !== "Crit RATE" &&
        name !== "Base" &&
        value === selectedPriorityData.substats["Base"].result
      )
        return null;

      const dmgGainValue = value - selectedPriorityData.substats["Base"].result;

      const relativeValue =
        (value * 100) / selectedPriorityData.substats["Base"].result - 100;

      const roundedVal = +dmgGainValue.toFixed(0);
      const revRGB = 255 - (relativeValue / highestPercentage) * 255;
      const cellStyle = {
        color: `rgba(${revRGB}, 255,${revRGB}, 1)`,
        opacity: roundedVal === 0 ? 0.25 : 1,
      };

      return (
        <td
          className={`${roundedVal === 0 ? "opacity-5" : ""}`}
          key={`${name}-percentage`}
          style={cellStyle}
        >
          {roundedVal > 0 ? "+" : ""}
          {roundedVal || "-"}
        </td>
      );
    });
  }, [priorityData, selectedPriorityData, selectedOption]);

  //
  //  RELATIVE % ROWS
  //
  const relativeTableRows = useMemo(() => {
    if (!selectedPriorityData?.substats) return null;

    const highestGainsNum = Math.max(
      ...Object.values(selectedPriorityData.substats).map((x) => x.result)
    );

    const highestPercentage =
      (highestGainsNum * 100) / selectedPriorityData.substats["Base"].result -
      100;

    return [
      "% gain over base",
      ...Object.keys(selectedPriorityData?.substats),
    ].map((name) => {
      const value = selectedPriorityData?.substats?.[name]?.result;
      if (!value) return <td key={name}>{name}</td>;
      if (
        name !== "Crit RATE" &&
        name !== "Base" &&
        value === selectedPriorityData.substats["Base"].result
      )
        return null;

      const relativeValue =
        (value * 100) / selectedPriorityData.substats["Base"].result - 100;

      const roundedVal = +relativeValue.toFixed(2);
      const revRGB = 255 - (relativeValue / highestPercentage) * 255;
      const cellStyle = {
        color: `rgba(${revRGB}, 255,${revRGB}, 1)`,
        opacity: roundedVal === 0 ? 0.25 : 1,
      };

      return (
        <td
          className={`${roundedVal === 0 ? "opacity-5" : ""}`}
          key={`${name}-percentage`}
          style={cellStyle}
        >
          {roundedVal > 0 ? "+" : ""}
          {roundedVal ? `${roundedVal}%` : "-"}
        </td>
      );
    });
  }, [priorityData, selectedPriorityData, selectedOption]);

  //
  //  RELATIVE TO ROLL % ROWS
  //
  const relativeRollTableRows = useMemo(() => {
    if (relativeTo === "Base") return null;
    if (!selectedPriorityData?.substats) return null;

    return [
      `% diff vs ${relativeTo} roll`,
      ...Object.keys(selectedPriorityData.substats),
    ].map((name) => {
      const value = selectedPriorityData?.substats?.[name]?.result;
      if (!value) return <td key={name}>{name}</td>;
      if (
        name !== "Crit RATE" &&
        name !== "Base" &&
        value === selectedPriorityData.substats["Base"].result
      )
        return null;

      const dmgGainValue = value - selectedPriorityData.substats["Base"].result;
      const dmgRelToGainValue =
        selectedPriorityData.substats[relativeTo].result -
        selectedPriorityData.substats["Base"].result;

      const relativeValue =
        dmgRelToGainValue === 0
          ? 0
          : ((dmgGainValue - dmgRelToGainValue) / dmgRelToGainValue) * 100;

      const roundedVal = +relativeValue.toFixed(2);
      const revRGB =
        roundedVal === 0 ? 0 : 255 - Math.abs(relativeValue / 50) * 255;

      const cellStyle = {
        color:
          roundedVal === 0
            ? "white"
            : roundedVal > 0
            ? `rgba(${revRGB}, 255,${revRGB}, 1)`
            : `rgba(255, ${revRGB},${revRGB}, 1)`,
      };

      return (
        <td key={`${name}-percentage`} style={cellStyle}>
          {roundedVal > 0 ? "+" : ""}
          {roundedVal}%
        </td>
      );
    });
  }, [priorityData, selectedPriorityData, selectedOption, relativeTo]);

  const iconClassNames = ["sort-direction-icon", !show ? "rotate-180deg" : ""]
    .join(" ")
    .trim();

  return priorityData.length > 0 ? (
    <div className="expanded-row flex">
      <div className="substat-priority-wrapper">
        <div className="clickable" onClick={() => setShow((prev) => !prev)}>
          {show ? "Hide" : "Show"} substat priority
          <FontAwesomeIcon
            className={iconClassNames}
            icon={faChevronUp}
            size="1x"
          />
        </div>
        {show && (
          <div className="substat-priority-list">
            <div className="calc-selection">{calcsSelection}</div>
            <table className="substat-table" cellSpacing={0}>
              <tbody>
                <tr>{tableHeaders}</tr>
                <tr>{resultsTableRows}</tr>
                {/* <tr>{rankingsTableRows}</tr> */}
                <tr>{dmgGainTableRows}</tr>
                <tr>{relativeTableRows}</tr>
                {relativeTo !== "Base" ? (
                  <tr>{relativeRollTableRows}</tr>
                ) : null}
              </tbody>
            </table>
            <div className="substat-priority-help">
              * above table shows how an additional single max substat roll
              affects your leaderboard result. How you interpret this data is up
              to you ¯\_(ツ)_/¯.
              <br />
              One interesting use is to find if you hit diminishing returns on
              any of your stats. For example, some Ayaka builds with extremely
              high Crit DMG% might start seeing a better performance with ATK%
              roll instead. Similarly if any of the % gains is much higher than
              the rest, chances are your build is unbalanced and needs that
              stat.
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;
};