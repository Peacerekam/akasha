import React, { useContext, useMemo } from "react";

import {
  allSubstatsInOrder,
  FETCH_ARTIFACTS_URL,
  getArtifactCvColor,
  getInGameSubstatValue,
  getSubstatsInOrder,
  isPercent,
  normalizeText,
} from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import {
  AdsComponent,
  ARBadge,
  CustomTable,
  HelpBox,
  RegionBadge,
  StatIcon,
  StylizedContentBlock,
} from "../../components";
import { TableColumn } from "../../types/TableColumn";

import DomainBackground from "../../assets/images/domain-background.jpg";
import {
  FETCH_ARTIFACT_FILTERS_URL,
  getRainbowTextStyle,
} from "../../utils/helpers";
import { HoverElementContext } from "../../context/HoverElement/HoverElementContext";
import { BASENAME, showAds } from "../../App";

export type ArtifactColumns = {
  _id: string;
  uid: string;
  name: string;
  setName: string;
  stars: 1 | 2 | 3 | 4 | 5;
  substats: any[];
  critValue: number;
  icon: string;
  nickname: string;
  [key: string]: any;
};

export const ArtifactsPage: React.FC = () => {
  const { hoverElement } = useContext(HoverElementContext);
  const navigate = useNavigate();

  const pathname = window.location.pathname;

  const ARTIFACT_COLUMNS: TableColumn<ArtifactColumns>[] = useMemo(
    () => [
      {
        name: "#",
        width: "0px",
        cell: (row) => {
          return (
            <div className="hide-on-custom">
              <span>{row.index}</span>
            </div>
          );
        },
      },
      {
        name: "Owner",
        sortable: false,
        sortField: "owner.nickname",
        width: "180px",
        cell: (row) => {
          if (!row.owner?.adventureRank) return <></>;
          return (
            <a
              className="row-link-element"
              onClick={(event) => {
                event.preventDefault();
                navigate(`/profile/${row.uid}`);
              }}
              href={`${BASENAME}/profile/${row.uid}`}
            >
              {/* <ARBadge adventureRank={row.owner.adventureRank} /> */}
              <RegionBadge region={row.owner?.region} />
              {row.owner.nickname}
            </a>
          );
        },
      },
      {
        name: "Name",
        sortable: false,
        sortField: "name",
        width: "300px",
        cell: (row) => {
          return (
            <div className="table-icon-text-pair">
              <img className="table-icon" src={row.icon} />{" "}
              <span
                style={{
                  color: {
                    5: "orange",
                    4: "blueviolet",
                    3: "cornflowerblue",
                    2: "greenyellow",
                    1: "gray",
                  }[row.stars],
                }}
              >
                {/* <div style={{ marginBottom: '5px'}}>{"⭐".repeat(row.stars)}</div> */}
                <div>
                  {row.name}
                  {/* {row.level ? `+${row.level - 1}` : ""} */}
                </div>
              </span>
            </div>
          );
        },
      },
      {
        name: "Main stat",
        sortable: false,
        sortField: "mainStatKey",
        cell: (row) => {
          const key = row.mainStatKey.replace("Flat ", "").replace("%", "");
          const isPercenrage =
            row.mainStatKey.endsWith("%") ||
            row.mainStatKey?.endsWith("Bonus") ||
            ["Energy Recharge", "Crit RATE", "Crit DMG"].includes(row.mainStatKey);

          const mainStatValue = isPercenrage
            ? Math.round(row.mainStatValue * 10) / 10
            : Math.round(row.mainStatValue);

          return (
            <div className="nowrap">
              {mainStatValue}
              {isPercenrage ? "%" : ""} {key}
            </div>
          );
        },
      },
      ...[0, 1, 2, 3].map((i) => ({
        name: <span className="weak-filler-line" />,
        sortable: true,
        sortFields: allSubstatsInOrder.map((key) => `substats.${key}`),
        colSpan: i === 0 ? 4 : 0,
        width: "100px",
        getDynamicTdClassName: (row: any) => {
          const reordered = getSubstatsInOrder(row);
          const key = reordered?.[i];
          if (!key) return "";
          return normalizeText(key);
        },
        cell: (row: any) => {
          const reordered = getSubstatsInOrder(row);
          const key = reordered?.[i];

          if (!key) return <></>;

          const substatValue = getInGameSubstatValue(row.substats[key], key);
          const isCV = key.includes("Crit");

          return (
            <div
              key={normalizeText(key)}
              className={`substat flex nowrap ${normalizeText(key)} ${
                isCV ? "critvalue" : ""
              }`}
            >
              <span style={{ marginRight: "5px" }}>
                <StatIcon name={key} />
              </span>
              {substatValue}
              {isPercent(key) ? "%" : ""}
            </div>
          );
        },
      })),
      {
        name: "Crit Value",
        sortable: true,
        sortField: "critValue",
        width: "100px",
        cell: (row) => {
          const textColor = getArtifactCvColor(row.critValue);
          let style = {} as React.CSSProperties;

          if (textColor === "rainbow") {
            style = getRainbowTextStyle();
          } else {
            style.color = textColor;
          }

          return <span style={style}>{row.critValue.toFixed(1)}</span>;
        },
      },
    ],
    []
  );

  return (
    <div className="flex">
      {showAds && <AdsComponent dataAdSlot="6204085735" />}
      {hoverElement}
      <div className="content-block w-100">
        <StylizedContentBlock overrideImage={DomainBackground} />
        <HelpBox page="artifacts" />
        <CustomTable
          fetchURL={FETCH_ARTIFACTS_URL}
          filtersURL={FETCH_ARTIFACT_FILTERS_URL}
          columns={ARTIFACT_COLUMNS}
          defaultSort="critValue"
          projectParamsToPath
        />
      </div>
      {showAds && <AdsComponent dataAdSlot="6204085735" />}
    </div>
  );
};
