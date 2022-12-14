import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  CritRatio,
  StatIcon,
  WeaponMiniDisplay,
  DisplaySets,
  CustomTable,
  ReplaceRowDataOnHover,
  StylizedContentBlock,
  HelpBox,
} from "../../components";
import { TableColumn } from "../../types/TableColumn";
import { ARBadge } from "../LeaderboardsPage";

import DomainBackground from "../../assets/images/Concept_Art_Liyue_Harbor.webp";
import {
  FETCH_BUILDS_URL,
  FETCH_CHARACTER_FILTERS_URL,
} from "../../utils/helpers";
import { HoverElementContext } from "../../context/HoverElement/HoverElementContext";
import { BASENAME } from "../../App";

export type BuildsColumns = {
  _id: string;
  uid: string;
  name: string;
  icon: string;
  totalCritValue: number;
  nickname: string;
  constellation: number;
  [key: string]: any;
};

export const BuildsPage: React.FC = () => {
  const { hoverElement } = useContext(HoverElementContext);
  const navigate = useNavigate();
  const pathname = window.location.pathname;

  const BUILDS_COLUMNS: TableColumn<BuildsColumns>[] = useMemo(
    () => [
      {
        name: "#",
        width: "0px",
        cell: (row) => {
          return <div>{row.index}</div>;
        },
      },
      {
        name: "Owner",
        sortField: "owner.nickname",
        width: "180px",
        sortable: true,
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
              <ARBadge adventureRank={row.owner.adventureRank} />
              {row.owner.nickname}
            </a>
          );
        },
      },
      {
        name: "Name",
        sortable: true,
        sortField: "name",
        cell: (row) => {
          return (
            <div className="table-icon-text-pair">
              <img className="table-icon" src={row.icon} />
              {row.type !== "current" ? (
                <ReplaceRowDataOnHover data={row.name} onHoverData={row.type} />
              ) : (
                row.name
              )}
            </div>
          );
        },
      },
      {
        name: "Constellation",
        sortable: true,
        sortField: "constellation",
        cell: (row) => {
          const constellation = row.constellation ?? 0;
          return (
            <div className="c-badge-wrapper">
              <div className={`c-badge c-${constellation}-badge`}>
                C{constellation}
              </div>
            </div>
          );
        },
      },
      {
        name: "Weapon",
        // grow: 0,
        width: "60px",
        sortable: true,
        sortField: "weapon.name",
        cell: (row) => {
          const refinement =
            (row.weapon.weaponInfo?.refinementLevel?.value ?? 0) + 1;
          return (
            <WeaponMiniDisplay icon={row.weapon.icon} refinement={refinement} />
          );
        },
      },
      {
        name: "Sets",
        sortable: true,
        sortField: "artifactSetsFlat",
        cell: (row) => {
          return <DisplaySets artifactSets={row.artifactSets} />;
        },
      },
      {
        name: "Crit Ratio",
        sortable: true,
        sortFields: ["critValue", "stats.critRate", "stats.critDamage"],
        cell: (row) => {
          return <CritRatio stats={row.stats} overrideCV={row.critValue} />;
        },
      },
      {
        name: "Max HP",
        // selector: (row) => row.stats.maxHp.value.toFixed(0),
        sortable: true,
        sortField: "stats.maxHp.value",
        cell: (row) => {
          return (
            <div className="flex gap-3 nowrap">
              <StatIcon name="HP" />
              {row.stats.maxHp.value.toFixed(0)}
            </div>
          );
        },
      },
      {
        name: "ATK",
        // selector: (row) => row.stats.atk.value.toFixed(0),
        sortable: true,
        sortField: "stats.atk.value",
        cell: (row) => {
          return (
            <div className="flex gap-3 nowrap">
              <StatIcon name="ATK" />
              {row.stats.atk.value.toFixed(0)}
            </div>
          );
        },
      },
      {
        name: "DEF",
        // selector: (row) => row.stats.def.value.toFixed(0),
        sortable: true,
        sortField: "stats.def.value",
        cell: (row) => {
          return (
            <div className="flex gap-3 nowrap">
              <StatIcon name="DEF" />
              {row.stats.def.value.toFixed(0)}
            </div>
          );
        },
      },
      {
        name: "EM",
        // selector: (row) => row.stats.elementalMastery.value.toFixed(0),
        sortable: true,
        sortField: "stats.elementalMastery.value",
        cell: (row) => {
          return (
            <div className="flex gap-3 nowrap">
              <StatIcon name="Elemental Mastery" />
              {+row.stats.elementalMastery.value.toFixed(0) || 0}
            </div>
          );
        },
      },
      {
        name: "ER%",
        // selector: (row) =>
        //   `${(row.stats.energyRecharge.value * 100).toFixed(1)}%`,
        sortable: true,
        sortField: "stats.energyRecharge.value",
        cell: (row) => {
          return (
            <div className="flex gap-3 nowrap">
              <StatIcon name="Energy Recharge" />
              {(row.stats.energyRecharge.value * 100).toFixed(1)}%
              {/* {(row.stats.energyRecharge.value * 100).toFixed(1)}% */}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="flex">
      {hoverElement}
      <div className="content-block w-100">
        <StylizedContentBlock overrideImage={DomainBackground} />
        <HelpBox page="builds" />
        <CustomTable
          fetchURL={FETCH_BUILDS_URL}
          filtersURL={FETCH_CHARACTER_FILTERS_URL}
          columns={BUILDS_COLUMNS}
          defaultSort="critValue"
          expandableRows
          projectParamsToPath
        />
      </div>
    </div>
  );
};
