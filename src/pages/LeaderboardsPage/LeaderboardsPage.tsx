import "./style.scss";

import {
  CalculationTeammate,
  CritRatio,
  CustomTable,
  DisplaySets,
  RegionBadge,
  StatIcon,
  StylizedContentBlock,
  TeammatesCompact,
  WeaponMiniDisplay,
} from "../../components";
import { Chart as ChartJS, registerables } from "chart.js";
import {
  FETCH_CATEGORIES_URL_V2,
  FETCH_CHARACTER_FILTERS_URL,
  FETCH_LEADERBOARDS_URL,
  getRelevantCharacterStats,
  iconUrlToNamecardUrl,
  normalizeText,
  uidsToQuery,
} from "../../utils/helpers";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AdsComponentManager } from "../../components/AdsComponentManager";
import { BuildsColumns } from "../BuildsPage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HoverElementContext } from "../../context/HoverElement/HoverElementContext";
import { IS_PRODUCATION } from "../../utils/maybeEnv";
import { LastProfilesContext } from "../../context/LastProfiles/LastProfilesContext";
import { Line } from "react-chartjs-2";
import { TableColumn } from "../../types/TableColumn";
import { TitleContext } from "../../context/TitleProvider/TitleProviderContext";
import { TranslationContext } from "../../context/TranslationProvider/TranslationProviderContext";
import axios from "axios";
import debounce from "lodash/debounce";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

ChartJS.register(...registerables);

type CategoryWeaponInfo = {
  calculationId: string;
  defaultVariant?: string;
  icon: string;
  name: string;
  rarity: string;
  refinement: number;
  substat: string;
  type: string;
  details: string;
  teammates: CalculationTeammate[];
  short: string;
  filters?: {
    displayName: string;
    name: string;
    query: any;
  }[];
};

type CalculationInfoResponse = {
  hidden?: boolean;
  label?: string;
  name: string;
  short: string;
  details: string;
  addDate: number;
  element: string;
  c6: "c6" | "";
  rarity: number;
  count: number;
  characterId: number;
  characterName: string;
  characterIcon: string;
  weaponsCount: number;
  weapons: CategoryWeaponInfo[];
};

export const LeaderboardsPage: React.FC = () => {
  // state
  const [calculationInfo, setCalculationInfo] =
    useState<CalculationInfoResponse[]>();
  const [inputUID, setInputUID] = useState<string>("");
  const [lookupUID, setLookupUID] = useState<string>("");

  // context
  const { setTitle } = useContext(TitleContext);
  const { lastProfiles } = useContext(LastProfilesContext);
  const { hoverElement } = useContext(HoverElementContext);
  const { translate } = useContext(TranslationContext);

  // hooks
  const { calculationId, variant } = useParams();
  const characterId = calculationId?.slice(0, -2);
  const navigate = useNavigate();

  const currentCategory = calculationId ?? "";
  const calculationSortKey = currentCategory
    ? // ? `calculations.${currentCategory}.result`
      "calculation.result"
    : "";

  useEffect(() => {
    fetchCalculationInfo();
  }, [characterId]);

  useEffect(() => {
    fetchChartData();
  }, [calculationId, variant]);

  const debouncedSetLookupUID = useCallback(debounce(setLookupUID, 350), []);

  useEffect(() => {
    debouncedSetLookupUID(inputUID);
  }, [inputUID]);

  const thisCalc = calculationInfo?.find((c) =>
    c.weapons.find((w) => w.calculationId === calculationId)
  );

  const thisWeaponCalc = thisCalc?.weapons.find(
    (w) => w.calculationId === calculationId
  );

  useEffect(() => {
    setTitle(`${thisCalc?.name} | Akasha System`);
  }, [thisCalc]);

  const LEADERBOARDS_COLUMNS: TableColumn<BuildsColumns>[] = useMemo(
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
        // sortable: true,
        // sortField: "uid",
        // sortField: "owner.nickname",
        width: "180px",
        cell: (row) => {
          const isEnkaProfile = isNaN(+row.uid);
          return (
            <a
              className={`row-link-element ${
                isEnkaProfile ? "enka-profile" : ""
              }`}
              onClick={(event) => {
                event.preventDefault();
                navigate(`/profile/${row.uid}`);
              }}
              href={`/profile/${row.uid}`}
            >
              {/* <ARBadge adventureRank={row.owner?.adventureRank} /> */}
              <RegionBadge region={row.owner?.region} />
              {/* {isEnkaProfile ? <EnkaBadge /> : ""} */}
              {row.owner?.nickname}
            </a>
          );
        },
      },
      {
        name: "Build name",
        sortable: false,
        sortField: "type",
        cell: (row) => {
          return (
            <div className="table-icon-text-pair">
              {row.type !== "current" ? (
                <span style={{ maxWidth: 200 }}>{row.type}</span>
              ) : (
                <span style={{ opacity: 0.25 }}>{translate(row.name)}</span>
              )}
            </div>
          );
        },
      },
      {
        name: "Sets",
        sortable: false,
        // sortField: `calculations.${currentCategory}.stats.artifactSetsFlat`,
        cell: (row) => {
          return <DisplaySets artifactSets={row.artifactSets} />;
        },
      },
      {
        name: "Crit Ratio",
        sortable: true,
        // sortFields: ["stats.critValue", "stats.critRate", "stats.critDMG"].map(
        //   (x) => `calculations.${currentCategory}.${x}`
        // ),
        sortFields: [
          "critValue",
          "stats.critRate.value",
          "stats.critDamage.value",
        ],
        cell: (row) => {
          // const build = row.calculations[currentCategory]?.stats;
          // return build ? <CritRatio stats={build} /> : <></>;
          return <CritRatio row={row} overrideCV={row.critValue} />;
        },
      },
      ...[0, 1, 2, 3].map((i) => ({
        name: <span className="weak-filler-line" />,
        sortable: true,
        // sortFields: allSubstatsInOrder.map((key) => `stats.${key}.value`),
        sortFields: [
          "stats.maxHp.value",
          "stats.atk.value",
          "stats.def.value",
          "stats.elementalMastery.value",
          "stats.energyRecharge.value",
          // "stats.hydroDamageBonus.value",
          // "stats.geoDamageBonus.value",
          // "stats.pyroDamageBonus.value",
          // "stats.cryoDamageBonus.value",
          // "stats.electroDamageBonus.value",
          // "stats.anemoDamageBonus.value",
          // "stats.dendroDamageBonus.value",
          // "stats.physicalDamageBonus.value",
          // "stats.healingBonus.value",
        ],
        colSpan: i === 0 ? 4 : 0,
        width: "70px",
        // getDynamicTdClassName: (row: any) => {
        //   const reordered = getSubstatsInOrder(row);
        //   const key = reordered?.[i];
        //   if (!key) return "";
        //   return normalizeText(key);
        // },
        cell: (row: any) => {
          const relevantStats = getRelevantCharacterStats(row);

          const _stat = relevantStats?.[i];
          if (!_stat) return <></>;

          const isPercent =
            _stat.name.includes("Bonus") || _stat.name === "Energy Recharge";

          let _value = _stat.value !== null ? +_stat.value : _stat.value;

          if (["Healing Bonus", "Energy Recharge"].includes(_stat.name)) {
            _value *= 100;
          }

          _value = _value?.toFixed(isPercent ? 1 : 0);

          if (_value === "-0" || _value === "-0.0") {
            _value = "0";
          }

          return (
            <div
              key={normalizeText(_stat.name)}
              className={`character-stat flex nowrap ${normalizeText(
                _stat.name.replace("%", "")
              )}`}
            >
              <span className="mr-3">
                <StatIcon name={_stat.name.replace("%", "")} />
              </span>
              {_value}
              {isPercent ? "%" : ""}
              {/* {_stat.name} */}
            </div>
          );
        },
      })),
      {
        name: thisWeaponCalc?.short || "???", // currentCategory.split(' - ')[1],
        // width: "100px",
        sortable: true,
        sortField: calculationSortKey,
        cell: (row: any) => {
          // const calcResult = row.calculations[currentCategory]?.result?.toFixed(0)
          const calcResult = row.calculation.result?.toFixed(0);
          return (
            <div style={{ color: "orange", fontWeight: 600 }}>{calcResult}</div>
          );
        },
      },
    ],
    [
      currentCategory,
      calculationInfo,
      thisWeaponCalc?.short,
      calculationSortKey,
      translate,
      // FETCH_LEADERBOARDS_URL,
    ]
  );

  const fetchCalculationInfo = async () => {
    if (!characterId) return;

    const opts = { params: { characterId } };
    const response = await axios.get(FETCH_CATEGORIES_URL_V2, opts);
    const { data }: { data: CalculationInfoResponse[] } = response.data;

    const sortFn = (a: CalculationInfoResponse, b: CalculationInfoResponse) => {
      if (a.label === b.label) {
        // C6 leaderboards show last
        if (b.name.startsWith("C6")) {
          return -1;
        }
        if (a.name.startsWith("C6")) {
          return 1;
        }

        // similar names will sort based on calcId
        if (a.name.slice(0, 7) === b.name.slice(0, 7)) {
          const _a_id = a.weapons?.[0]?.calculationId;
          const _b_id = b.weapons?.[0]?.calculationId;
          return _b_id > _a_id ? -1 : 1;
        }

        // otherwise sort based on name alone
        return a.name > b.name ? -1 : 1;
      }
      return a.label === "niche" ? 1 : -1;
    };

    const sortedData = data.sort(sortFn);
    setCalculationInfo(sortedData);
  };

  const [chartData, setChartData] = useState<any[]>([]);

  const uidsQuery = useMemo(
    () => uidsToQuery(lastProfiles.map((a) => a.uid)),
    [lastProfiles.length]
  );

  const fetchChartData = async () => {
    const chartURL = `/api/charts/calculations/${calculationId}`;
    const response = await axios.get(chartURL, {
      params: {
        variant,
        uids: uidsQuery,
      },
    });
    const { data } = response.data;

    setChartData(data);
  };

  const blockBackgroundImage = thisCalc?.characterIcon
    ? iconUrlToNamecardUrl(thisCalc?.characterIcon)
    : "";

  const displayVariantSelector =
    thisWeaponCalc?.filters && thisWeaponCalc?.filters?.length > 0 ? (
      <div className="variant-selection-wrapper">
        Available sub-categories:
        <div className="variant-selection">
          <a
            className={!variant ? "current-selection" : ""}
            onClick={(event) => {
              event.preventDefault();
              navigate(`/leaderboards/${calculationId}/`);
            }}
            href={`/leaderboards/${calculationId}/`}
          >
            NONE
          </a>
          {/* get this from API instead */}
          {thisWeaponCalc.filters?.map((val) => {
            const isActive = variant === val.name;
            return (
              <a
                key={val.name}
                className={isActive ? "current-selection" : ""}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(`/leaderboards/${calculationId}/${val.name}`);
                }}
                href={`/leaderboards/${calculationId}/${val.name}`}
              >
                {val.displayName}
              </a>
            );
          })}
        </div>
      </div>
    ) : null;

  const displayRelevantCategories = (
    <>
      <div className="other-calc-container">
        {calculationInfo?.map((_cat) => {
          const categoryName = _cat.name;
          const isNiche = _cat.label === "niche";

          return (
            <div
              key={_cat.name}
              style={{
                opacity: isNiche ? 0.5 : 1,
                background: !IS_PRODUCATION && _cat?.hidden ? "#ff00ff44" : "",
                display: IS_PRODUCATION
                  ? _cat?.hidden
                    ? "none"
                    : "block"
                  : "block",
              }}
            >
              {isNiche && (
                <span
                  style={{ width: "auto", display: "inline-block" }}
                  className="c-badge-wrapper"
                  title="This leaderboard will not be prioritized on profile highlights"
                >
                  <span
                    style={{ width: "auto", fontSize: 11, marginRight: 5 }}
                    className={`c-badge c-0-badge`}
                  >
                    {_cat.label?.toUpperCase()}
                  </span>
                </span>
              )}
              {categoryName}
              <div className="flex">
                {_cat.weapons.map((_weapon: any, index) => {
                  const weaponicon = _weapon.icon ?? "";
                  const weaponRefinement = _weapon.refinement ?? 0;
                  const isActive = _weapon.calculationId === calculationId;
                  const _variant = _weapon?.defaultVariant || "";
                  const leaderboardPath = `leaderboards/${_weapon.calculationId}/${_variant}`;

                  return (
                    <a
                      className={isActive ? "current-selection" : ""}
                      key={_weapon.name}
                      title={`${_weapon.name} R${weaponRefinement}`}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(`/${leaderboardPath}`);
                      }}
                      href={`/${leaderboardPath}`}
                      style={{
                        background:
                          !IS_PRODUCATION && _weapon?.hidden ? "#ff00ff44" : "",
                        display: IS_PRODUCATION
                          ? _weapon?.hidden
                            ? "none"
                            : "block"
                          : "block",
                      }}
                    >
                      <WeaponMiniDisplay
                        icon={weaponicon}
                        refinement={weaponRefinement}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {displayVariantSelector}
    </>
  );

  const options = {
    maintainAspectRatio: true,
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          title: function (a: any[]) {
            return a[0] ? `top ${a[0].label}%` : "";
          },
          // label: (a: any) => {
          //   if (!a || !a.dataset) return "";
          //   const max = a.dataset.data[a.dataIndex].max
          //   const min = a.dataset.data[a.dataIndex].min
          //   return [`${a.formattedValue}`, '', `max: ${max.toFixed(3)}`, `min: ${min.toFixed(3)}`]
          // },
        },
      },
      legend: {
        display: false,
        // labels: {
        //   color: "#ebecee",
        // }
      },
    },
    type: "scatter",
    scales: {
      x: {
        grid: {
          color: "#acaeb333",
          borderDash: [2, 2],
        },
        ticks: {
          color: "#ebecee",
          callback: function (value: any) {
            return `top ${value}%`;
          },
        },
      },
      y: {
        grid: {
          color: "#acaeb333",
          borderDash: [2, 2],
        },
        ticks: {
          color: "#ebecee",
          callback: function (value: any) {
            return `${value}`; // ... avg dmg?
          },
        },
      },
    },
    interaction: {
      intersect: false,
    },
    animation: {
      duration: 0,
    },
  };

  const displayChart = useMemo(() => {
    const formattedData = chartData.map((el, i) => ({
      y: el.avg,
      x: i + 1,
      // min: el.min,
      // max: el.max
    }));

    const datasets = [
      {
        data: formattedData,
      },
    ];

    // @TODO: make context around Podium + Chart + Tables
    // @FIX: make context around Podium + Chart + Tables

    // make context around Podium + Chart + Tables
    //
    // mainTable = provide data for podium if page = 0
    // miniTable = provide data for chart searched player points
    // podium = take data from mainTable if page = 0, otherwise ask for first 3 elements

    // @TODO: make context around Podium + Chart + Tables
    // @FIX: make context around Podium + Chart + Tables

    return (
      <div className="lb-chart-wrapper">
        <Line
          data={{
            labels: formattedData.map((_, i) => i + 1),
            datasets,
          }}
          options={options}
        />
      </div>
    );
  }, [chartData]);

  const isNiche = thisCalc?.label === "niche";

  return (
    <div className="flex" key={calculationId}>
      {hoverElement}
      <div id="content-container" className=" w-100">
        <div
          key={currentCategory}
          className="content-block w-100"
          style={{ display: "inline-block" }}
        >
          {/* <NotificationBar /> */}
          <StylizedContentBlock
            variant="gradient"
            revealCondition={!!calculationInfo}
            overrideImage={blockBackgroundImage}
          />
          <div
            className="relative block-highlight"
            style={{
              whiteSpace: "break-spaces",
              margin: "10px",
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <a
                className="pointer back-btn"
                href="/leaderboards"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/leaderboards");
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} size="1x" /> GO BACK
              </a>
            </div>
            <div className="flex">
              {displayChart}
              {/* {displayPodium} */}
              {thisCalc && (
                <div
                  style={{
                    width: "calc(100% - 500px)",
                    minWidth: 300,
                    flexGrow: 1,
                  }}
                >
                  <div style={{ margin: 10 }}>
                    <div
                      className="flex gap-10 flex-wrap-no-wrap"
                      style={{
                        fontSize: 30,
                        // borderBottom: "1px solid white",
                      }}
                    >
                      <img
                        alt={thisCalc.name}
                        style={{ width: 40, height: 40, marginBottom: 15 }}
                        src={thisCalc.characterIcon}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {translate(thisCalc.characterName)} - {thisCalc.name}
                      </div>
                    </div>
                    <div>{thisWeaponCalc?.details}</div>
                  </div>
                  <div style={{ margin: "20px 10px" }}>
                    <div>
                      <span
                        className="flex gap-10"
                        style={{ flexWrap: "inherit" }}
                      >
                        Weapon:
                        <WeaponMiniDisplay
                          icon={thisWeaponCalc?.icon || ""}
                          refinement={thisWeaponCalc?.refinement || 1}
                        />
                        {translate(thisWeaponCalc?.name || "")}
                      </span>
                    </div>
                  </div>
                  <div
                    className="lb-team-display-wrapper"
                    style={{ margin: "20px 10px" }}
                  >
                    <div>Team:</div>
                    <TeammatesCompact
                      teammates={thisWeaponCalc?.teammates}
                      scale={2.75}
                    />
                  </div>
                  <div>
                    {isNiche && (
                      <div
                        style={{
                          marginTop: 25,
                          color: "gray",
                          fontSize: 14,
                          marginLeft: 10,
                          marginBottom: 10,
                        }}
                      >
                        This leaderboard was marked as
                        <span
                          style={{ width: "auto", display: "inline" }}
                          className="c-badge-wrapper"
                          title="This leaderboard will not be prioritized on profile highlights"
                        >
                          <span
                            style={{
                              width: "auto",
                              fontSize: 11,
                              marginLeft: 5,
                              marginRight: 5,
                              display: "inline",
                              color: "white",
                            }}
                            className={`c-badge c-0-badge`}
                          >
                            {thisCalc.label?.toUpperCase()}
                          </span>
                        </span>
                        and will <b>not</b> be prioritized on profile highlights
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* <AdsComponentManager
            adType="LeaderboardBTF"
            dataAdSlot="6204085735"
            hybrid="mobile"
            hideOnDesktop
          /> */}

          <div className="flex-special-container">
            <AdsComponentManager adType="Video" />
            <div className="relative other-calculations-display block-highlight highlight-tile-container">
              {displayRelevantCategories}
            </div>
          </div>
        </div>

        <div className="content-block w-100">
          <StylizedContentBlock
            revealCondition={!!thisCalc?.characterIcon}
            overrideImage={blockBackgroundImage}
          />
          <div className="relative search-input-wrapper">
            Enter UID / nickname
            <div>
              <div className="search-input relative">
                <input
                  defaultValue={inputUID}
                  onChange={(event) => {
                    setInputUID(event.target.value);
                  }}
                />
                {!inputUID && (
                  <span className="fake-placeholder">type here...</span>
                )}
              </div>
            </div>
          </div>
          {calculationInfo && (
            <div key={`${currentCategory}${variant}`}>
              <CustomTable
                fetchURL={FETCH_LEADERBOARDS_URL}
                // wont work because of how I handle fetchParams.filter
                // filtersURL={`${FETCH_CHARACTER_FILTERS_URL}?type=leaderboards`}
                fetchParams={{
                  uids: uidsToQuery(lastProfiles.map((a) => a.uid)),
                  uid: lookupUID,
                  variant,
                  filter: "[all]1",
                  calculationId: currentCategory,
                }}
                columns={LEADERBOARDS_COLUMNS}
                defaultSort={calculationSortKey}
                // calculationColumn={currentCategory}
                strikethrough={true}
                expandableRows
                ignoreEmptyUidsArray
                alwaysShowIndexColumn
                // hidePagination
              />

              {/* spacer */}
              <div style={{ marginTop: "30px" }} />

              <CustomTable
                fetchURL={FETCH_LEADERBOARDS_URL}
                fetchParams={{ variant, calculationId: currentCategory }}
                filtersURL={`${FETCH_CHARACTER_FILTERS_URL}?type=leaderboards`}
                columns={LEADERBOARDS_COLUMNS}
                defaultSort={calculationSortKey}
                // calculationColumn={currentCategory}
                strikethrough={true}
                expandableRows
                projectParamsToPath
                alwaysShowIndexColumn
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
