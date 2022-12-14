import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import PerfectScrollbar from "react-perfect-scrollbar";
import {
  CalculationList,
  StatIcon,
  Spinner,
  Pagination,
  ArtifactListCompact,
} from "../../components";
import {
  abortSignalCatcher,
  arrayPushOrSplice,
  FETCH_ACCOUNTS_URL,
  FETCH_COLLECTION_SIZE_URL,
  normalizeText,
} from "../../utils/helpers";
import { FiltersContainer, FilterOption } from "./Filters";
import { useLocation, useNavigate } from "react-router-dom";
import { HoverElementContext } from "../../context/HoverElement/HoverElementContext";
import "./style.scss";
import {
  FETCH_ARTIFACTS_URL,
  FETCH_LEADERBOARDS_URL,
  FETCH_BUILDS_URL,
} from "../../utils/helpers";

type CustomTableProps = {
  columns: any[];
  filtersURL?: string;
  fetchURL?: string;
  fetchParams?: any;
  defaultSort?: string;
  calculationColumn?: string;
  expandableRows?: boolean;
  hidePagination?: boolean;
  projectParamsToPath?: boolean;
  ignoreEmptyUidsArray?: boolean;
};

export type FetchParams = {
  sort: string;
  order: number;
  size: number;
  page: number;
  filter?: string;
  uids?: string;
};

const getCollectionName = (fetchURL: string = "") => {
  if (fetchURL?.startsWith(FETCH_ACCOUNTS_URL)) {
    return "accounts";
  }

  const collectionName = {
    [FETCH_ARTIFACTS_URL]: "artifacts",
    [FETCH_LEADERBOARDS_URL]: "characters",
    [FETCH_BUILDS_URL]: "characters",
  }[fetchURL];

  return collectionName;
};

export const CustomTable: React.FC<CustomTableProps> = ({
  fetchURL = null,
  fetchParams = {},
  columns = [],
  filtersURL,
  defaultSort = null,
  calculationColumn = "",
  expandableRows = false,
  hidePagination = false,
  projectParamsToPath = false,
  ignoreEmptyUidsArray = false,
}) => {
  const [isFetchingPagination, setIsFetchingPagination] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [totalRowsHash, setTotalRowsHash] = useState<string>("");
  const [totalRowsCount, setTotalRowsCount] = useState<number>(0);
  const { updateTableHoverElement } = useContext(HoverElementContext);
  const location = useLocation();

  const defaultParams = {
    sort: defaultSort || "",
    order: -1,
    size: 20,
    page: 1,
    filter: "",
    uids: "",
  };
  const [params, setParams] = useState<FetchParams>(defaultParams);

  const navigate = useNavigate();

  const noDataFound = useMemo(
    () => rows.length === 0 && !isLoading,
    [rows.length, isLoading]
  );

  const appendParamsToURL = () => {
    const tmp: string[] = [];
    for (const key of Object.keys(params)) {
      const value = (params as any)[key];
      if ((defaultParams as any)[key] === value) continue;
      tmp.push(`${key}=${value}`);
    }
    // const toAppend = encodeURI(tmp.join("&"));
    const toAppend = tmp.join("&");
    const newURL = `?${toAppend}`;
    navigate(newURL, { replace: true });
  };

  const readParamsFromURL = () => {
    if (!location.search) return;

    const searchQuery = location.search;
    const query = new URLSearchParams(searchQuery);

    const tmp: any = {};
    query.forEach((value, key) => {
      const actualValue = isNaN(+value) ? value : +value;
      if ((defaultParams as any)?.[key]?.toString() !== actualValue) {
        tmp[key] = actualValue;
      }
    });

    setParams((prev) => ({
      ...prev,
      ...tmp,
    }));
  };

  useEffect(() => {
    if (projectParamsToPath) {
      readParamsFromURL();
    }
  }, [projectParamsToPath]);

  useEffect(() => {
    if (projectParamsToPath) {
      appendParamsToURL();
    }

    if (fetchURL) {
      if (ignoreEmptyUidsArray && !fetchParams.uids && !fetchParams.uid) {
        setExpandedRows([]);
        setTotalRowsCount(0);
        setRows([]);
        return;
      }

      const abortController = new AbortController();
      handleFetch(abortController);
      return () => {
        abortController.abort();
      };
    }
  }, [
    JSON.stringify(params),
    JSON.stringify(fetchParams),
    fetchURL,
    projectParamsToPath,
    ignoreEmptyUidsArray,
  ]);

  const getSetTotalRows = async (totalRowsHash: string) => {
    if (!fetchURL) return;
    setIsFetchingPagination(true);
    const collectionName = getCollectionName(fetchURL);
    const totalRowsOpts = {
      params: {
        variant: collectionName,
        hash: totalRowsHash,
      },
    };

    const response = await axios.get(FETCH_COLLECTION_SIZE_URL, totalRowsOpts);

    const { totalRows } = response.data;
    setTotalRowsCount(totalRows);
    setIsFetchingPagination(false);
  };

  useEffect(() => {
    if (totalRowsHash) getSetTotalRows(totalRowsHash);
  }, [totalRowsHash]);

  useEffect(() => {
    setRows((prev) => {
      const newRows = prev.filter((row) => !row.isExpandRow);
      for (const expandedRowId of expandedRows) {
        const index = newRows.findIndex((row) => row._id === expandedRowId);
        if (index === -1) continue;

        const newRow = {
          ...newRows[index],
          isExpandRow: true,
        };

        const cutoffIndex = index + 1;
        newRows.splice(cutoffIndex, 0, newRow);
      }
      return newRows;
    });
  }, [JSON.stringify(expandedRows)]);

  const handleFetch = async (abortController: AbortController) => {
    if (!fetchURL) return;

    setIsLoading(true);

    const opts = {
      signal: abortController.signal,
      params: {
        ...params,
        ...fetchParams,
      },
    } as any;

    const getSetData = async () => {
      const response = await axios.get(fetchURL, opts);
      const { data, totalRowsHash } = response.data;

      setExpandedRows([]);
      setRows(data);
      setTotalRowsHash(totalRowsHash);
    };

    await abortSignalCatcher(getSetData);
    setIsLoading(false);
  };

  const tableClassNames = useMemo(
    () =>
      [
        "custom-table",
        params.sort?.startsWith("substats") // || params.sort === "critValue"
          ? `highlight-${normalizeText(params.sort?.replace("substats", ""))}`
          : "",
      ]
        .join(" ")
        .trim(),
    [params.sort]
  );

  const renderHeaders = useMemo(() => {
    const handleSetSort = (sortField: string) => {
      setParams((prev) => ({
        ...prev,
        sort: sortField,
        order: sortField === prev.sort ? prev.order * -1 : -1,
      }));
    };

    const handleClickHeader = (
      column: any,
      event: React.MouseEvent<HTMLTableCellElement, MouseEvent>
    ) => {
      const { sortable, sortField, sortFields } = column;
      if (!sortable || !sortField) return;
      handleSetSort(sortField);
    };

    const displaySortIcon = (order: number = 1) => {
      const iconClassNames = [
        "sort-direction-icon",
        order === -1 ? "rotate-180deg" : "",
      ]
        .join(" ")
        .trim();

      return (
        <FontAwesomeIcon
          className={iconClassNames}
          // icon={params.order === -1 ? faChevronDown : faChevronUp}
          icon={faChevronUp}
          size="1x"
        />
      );
    };

    const renderSortField = (key: string, index: number) => {
      const displayKey = key.split(".").pop(); // get last
      if (!displayKey) return null;
      const isHighlighted = params.sort && key === params.sort;
      const classNames = [
        "flex nowrap gap-5",
        isHighlighted ? "highlight-cell" : "",
      ]
        .join(" ")
        .trim();

      const fixKey =
        {
          critValue: "Crit Value",
          critRate: "Crit Rate",
          critDamage: "Crit DMG",
          critDMG: "Crit DMG",
        }[displayKey] || displayKey;

      return (
        <div
          key={key}
          className={classNames}
          onClick={() => handleSetSort(key)}
        >
          <StatIcon name={fixKey} />
          {fixKey}
          {isHighlighted ? displaySortIcon(params.order) : null}
        </div>
      );
    };

    return columns.map((column: any, index) => {
      const { name, sortable, sortField, sortFields, colSpan } = column;
      const isHighlighted =
        params.sort &&
        (sortField === params.sort || sortFields?.includes(params.sort));
      const classNames = [
        "relative",
        isHighlighted ? "highlight-cell" : "",
        sortable ? "sortable-column" : "",
      ]
        .join(" ")
        .trim();

      let columnName = name;

      if (sortFields?.includes(params.sort)) {
        const key = params.sort.split(".").pop();
        if (!key) return null;

        const fixKey =
          {
            critValue: "Crit Value",
            critRate: "Crit Rate",
            critDamage: "Crit DMG",
            critDMG: "Crit DMG",
          }[key] || key;

        columnName = (
          <>
            <StatIcon name={fixKey} /> {fixKey}
          </>
        );
      }

      return (
        <th
          key={`${name}-${index}`}
          className={classNames}
          onClick={(event) => handleClickHeader(column, event)}
          colSpan={isHighlighted ? colSpan ?? 0 : 1}
          style={{
            width: column.width,
            display: isHighlighted && colSpan === 0 ? "none" : "",
          }}
        >
          <span className="header-wrapper">
            {columnName}
            {isHighlighted ? displaySortIcon(params.order) : null}
          </span>
          {sortFields && (
            <span className="sort-fields-picker-wrapper">
              {sortFields.map(renderSortField)}
            </span>
          )}
        </th>
      );
    });
  }, [columns, params.order, params.sort]);

  const renderExpandRow = useCallback(
    (row: any) => (
      <>
        <ArtifactListCompact row={row} />
        <CalculationList row={row} />
      </>
    ),
    []
  );

  const hasOwnerColumn = useMemo(
    () => columns.findIndex((c) => c.name === "Owner") > -1,
    [columns]
  );

  const renderRows = useMemo(() => {
    const handleClickRow = (row: any) => {
      if (!expandableRows) return;
      setExpandedRows((prev) => arrayPushOrSplice(prev, row._id));
    };

    return rows.map((row) => {
      const { isExpandRow } = row;

      if (isExpandRow) {
        return (
          <tr key={`${row._id}-expanded`} className="expanded-tr">
            <td colSpan={columns.length}>{renderExpandRow(row)}</td>
          </tr>
        );
      }

      // @TODO: patreon
      const patreonObj = row.owner?.patreon;

      const rowClassNames = [
        expandableRows ? "pointer" : "",
        hasOwnerColumn && !!patreonObj?.active ? "decorate-row" : "",
        hasOwnerColumn && !!patreonObj?.active
          ? `patreon-${patreonObj?.color}`
          : "",
        // {
        //   1: "decorate-row patreon-gold",
        //   2: "decorate-row patreon-white",
        //   3: "decorate-row patreon-brown",
        // }[row.index as number],
      ]
        .join(" ")
        .trim();

      return (
        <tr
          key={row._id}
          className={rowClassNames}
          onMouseEnter={() =>
            updateTableHoverElement({ row, currentCategory: calculationColumn })
          }
          onMouseLeave={() =>
            updateTableHoverElement({
              hide: true,
              currentCategory: calculationColumn,
            })
          }
          onClick={() => handleClickRow(row)}
        >
          {columns.map((column, index) => {
            const { sortField, sortFields, getDynamicTdClassName } = column;
            const isHighlighted =
              params.sort &&
              (sortField === params.sort || sortFields?.includes(params.sort));

            const tdClassNames = [
              isHighlighted ? "highlight-cell" : "",
              getDynamicTdClassName ? getDynamicTdClassName(row) : "",
            ]
              .join(" ")
              .trim();

            return (
              <td
                style={{ width: column.width }}
                className={tdClassNames}
                key={`${sortField}-${index}`}
              >
                {column.cell(row)}
              </td>
            );
          })}
        </tr>
      );
    });
  }, [
    // JSON.stringify(expandedRows),
    // params.sort,
    JSON.stringify(rows),
    calculationColumn,
    columns.length,
  ]);

  const noDataRow = useMemo(
    () => (
      <tr>
        <td colSpan={columns.length}>
          <div style={{ textAlign: "center" }}>No data found</div>
        </td>
      </tr>
    ),
    [columns.length]
  );

  const wrapperClassNames = [
    "custom-table-wrapper",
    isLoading ? "disable-table" : "",
  ]
    .join(" ")
    .trim();

  const fillerRow = useMemo(() => {
    if (totalRowsCount < params.size) return null;
    const realRowsCount = rows.filter((r) => !r.isExpandRow).length;
    const numOfFillerRows = params.size - realRowsCount;
    const arr = Array(numOfFillerRows).fill(0);
    return arr.map(() => (
      <tr style={{ pointerEvents: "none" }}>
        <td colSpan={columns.length}></td>
      </tr>
    ));
  }, [rows.length, columns.length, params.size, totalRowsCount]);

  const handleChangeFilters = (filters: FilterOption[]) => {
    let stringified = "";

    filters.forEach((f) => {
      if (f.name !== "" && f.value !== "") {
        stringified += `[${f.name}]${f.value}`;
      }
    });

    if (params.filter === stringified) return;

    setParams((prev) => ({
      ...prev,
      page: 1,
      filter: stringified,
    }));
  };

  return (
    <div className={wrapperClassNames}>
      {filtersURL && (
        <FiltersContainer
          fetchURL={filtersURL}
          onFiltersChange={handleChangeFilters}
          projectParamsToPath
        />
      )}
      <PerfectScrollbar options={{}}>
        <table className={tableClassNames} cellSpacing={0}>
          <thead>
            <tr>{renderHeaders}</tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="dark-overlay-table-only">
                <td>
                  <Spinner />
                </td>
              </tr>
            )}
            {rows.length > 0 && renderRows}
            {noDataFound && noDataRow}
            {!noDataFound && fillerRow}
          </tbody>
        </table>
      </PerfectScrollbar>
      {!hidePagination && (
        <Pagination
          isLoading={isFetchingPagination}
          pageSize={params.size}
          pageNumber={params.page}
          totalRows={totalRowsCount}
          setParams={setParams}
        />
      )}
    </div>
  );
};
