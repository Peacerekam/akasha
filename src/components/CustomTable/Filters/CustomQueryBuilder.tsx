import { useMemo, useState } from "react";
import ReactSelect, { MultiValue } from "react-select";
import Highlighter from "react-highlight-words";
import { customTheme } from "../../../utils/reactSelectCustomFilterTheme";
import { isIcon, StatIcon } from "../../StatIcon";
import { OptionsResponse, FilterOption } from "./FiltersContainer";

type CustomQueryBuilderProps = {
  optionGroups: OptionsResponse;
  handleReplaceFilter: (filters: FilterOption[]) => void;
  pills: FilterOption[];
};

export const CustomQueryBuilder = ({
  optionGroups,
  handleReplaceFilter,
  pills,
}: CustomQueryBuilderProps) => {
  const [ textInput, setTextInput ] = useState('')
  const fieldKeyOptions = useMemo(
    () =>
      optionGroups.map((o, i) => {
        return {
          // index: i,
          label: o.fieldName,
          options: o.options.map((opt) => {
            const isStatIcon = isIcon(opt.name);
            const prefix =
              {
                "artifactSets.$1": "1p ",
                "artifactSets.$2": "2p ",
                "artifactSets.$4": "4p ",
              }[o.fieldKey] ?? "";

            return {
              label: (
                <span className="react-select-custom-option">
                  {opt.icon || isStatIcon ? (
                    <>
                      {isStatIcon ? (
                        <StatIcon name={opt.name ?? ""} />
                      ) : (
                        <img src={opt.icon} />
                      )}
                      <Highlighter
                        highlightClassName="text-highlight-class"
                        searchWords={[textInput]}
                        autoEscape={true}
                        textToHighlight={`${prefix}${opt.name}`}
                      />
                    </>
                  ) : (
                    opt.name
                  )}
                </span>
              ),
              rawLabel: `${prefix}${opt.name}`,
              value: opt.value,
              fieldKey: o.fieldKey,
            };
          }),
        };
      }),
    [optionGroups, textInput]
  );

  const selectedOptions = useMemo(() => {
    const allOpts = fieldKeyOptions.reduce((acc: any, val) => {
      const arr = acc.concat(val.options);
      return arr;
    }, []);

    return pills.map((pill) => {
      const option = allOpts.find((opt: any) => {
        const compA = opt.value === ""+pill.value;
        const compB = opt.fieldKey === pill.name;
        return compA && compB;
      });
      return option;
    });
  }, [JSON.stringify(pills), fieldKeyOptions]);

  const handleChange = (options: MultiValue<any>) => {
    const filters = options.map((o) => ({
      name: o.fieldKey ?? "",
      value: o.value,
    }));
    handleReplaceFilter(filters);
  };

  return (
    <div className="custom-query-builder-wrapper">
      <ReactSelect
        isMulti
        options={fieldKeyOptions}
        menuPortalTarget={document.body}
        styles={customTheme}
        maxMenuHeight={450}
        getOptionValue={(option: any) => option.rawLabel}
        placeholder="no filters"
        value={selectedOptions}
        defaultValue={selectedOptions}
        onInputChange={(value) => setTextInput(value)}
        onChange={(options) => {
          if (!options) return;
          handleChange(options);
        }}
      />
    </div>
  );
};