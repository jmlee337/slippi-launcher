import { debounce } from "lodash";
import { useReplays } from "@/store/replays";
import { useSettings } from "@/store/settings";
import React from "react";
import { FolderTreeNode } from "./FolderTreeNode";
import { FileList } from "./FileList";
import { DualPane } from "@/components/DualPane";
import { FilterToolbar } from "./FilterToolbar";
import { FileResult } from "common/replayBrowser";
import { extractAllPlayerNames, namesMatch } from "common/matchNames";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ReplayFileStats } from "../ReplayFileStats";
import List from "@material-ui/core/List";
import SearchIcon from "@material-ui/icons/Search";
import Typography from "@material-ui/core/Typography";
import { colors } from "common/colors";
import { useReplayFilter, FilterOptions } from "@/store/replayFilter";

export const ReplayBrowser: React.FC = () => {
  const filterOptions = useReplayFilter((store) => store.options);
  const setFilterOptions = useReplayFilter((store) => store.setOptions);

  const scrollRowItem = useReplays((store) => store.scrollRowItem);
  const setScrollRowItem = useReplays((store) => store.setScrollRowItem);
  const deleteFile = useReplays((store) => store.deleteFile);
  const files = useReplays((store) => store.files);
  const selectedItem = useReplays((store) => store.selectedFile.index);
  const selectFile = useReplays((store) => store.selectFile);
  const clearSelectedFile = useReplays((store) => store.clearSelectedFile);
  const loading = useReplays((store) => store.loading);
  const currentFolder = useReplays((store) => store.currentFolder);
  const folders = useReplays((store) => store.folders);
  const init = useReplays((store) => store.init);
  const fileErrorCount = useReplays((store) => store.fileErrorCount);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);

  React.useEffect(() => {
    init(rootSlpPath);
  }, [rootSlpPath, init]);

  const filterFunction = generateFilterFunction(filterOptions);
  const sortFunction = generateSortFunction(filterOptions);
  const filteredFiles = files.filter(filterFunction).sort(sortFunction);

  const setSelectedItem = (index: number | null) => {
    if (index === null) {
      clearSelectedFile();
    } else {
      const filePath = filteredFiles[index].fullPath;
      selectFile(index, filePath);
    }
  };

  const updateFilter = debounce((val) => setFilterOptions(val), 100);

  if (folders === null) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        flex: "1",
        position: "relative",
      }}
    >
      {selectedItem !== null ? (
        <ReplayFileStats
          index={selectedItem}
          total={filteredFiles.length}
          file={filteredFiles[selectedItem]}
          onNext={() =>
            setSelectedItem(
              Math.min(filteredFiles.length - 1, selectedItem + 1)
            )
          }
          onPrev={() => setSelectedItem(Math.max(0, selectedItem - 1))}
          onClose={() => setSelectedItem(null)}
        />
      ) : (
        <>
          <FilterToolbar onChange={updateFilter} value={filterOptions} />
          <div
            style={{
              display: "flex",
              flex: "1",
              position: "relative",
              overflow: "hidden",
              borderTop: `solid 2px ${colors.grayDark}`,
            }}
          >
            <DualPane
              id="replay-browser"
              resizable={true}
              minWidth={0}
              maxWidth={300}
              leftStyle={{ backgroundColor: "rgba(0,0,0, 0.3)" }}
              leftSide={
                <List dense={true} style={{ flex: 1, padding: 0 }}>
                  <div style={{ position: "relative", minHeight: "100%" }}>
                    <FolderTreeNode {...folders} />
                    {loading && (
                      <div
                        style={{
                          position: "absolute",
                          height: "100%",
                          width: "100%",
                          top: 0,
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                        }}
                      />
                    )}
                  </div>
                </List>
              }
              rightSide={
                loading ? (
                  <LoadingBox />
                ) : filteredFiles.length === 0 ? (
                  <EmptyFolder />
                ) : (
                  <FileList
                    onDelete={deleteFile}
                    onSelect={(index: number) => setSelectedItem(index)}
                    files={filteredFiles}
                    scrollRowItem={scrollRowItem}
                    setScrollRowItem={setScrollRowItem}
                  />
                )
              }
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              whiteSpace: "nowrap",
              padding: 5,
              backgroundColor: colors.grayDark,
              fontSize: 14,
            }}
          >
            <div>{currentFolder}</div>
            <div style={{ textAlign: "right" }}>
              {filteredFiles.length} files found.{" "}
              {files.length - filteredFiles.length} files filtered.{" "}
              {fileErrorCount > 0 ? `${fileErrorCount} files had errors.` : ""}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const LoadingBox: React.FC = () => {
  const progress = useReplays((store) => store.progress);
  let message = "Loading...";
  if (progress !== null) {
    message += ` ${Math.floor((progress.current / progress.total) * 100)}%`;
  }
  return <LoadingScreen message={message} />;
};

const EmptyFolder: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        fontSize: 74,
      }}
    >
      <SearchIcon fontSize="inherit" />
      <Typography variant="h6" style={{ marginTop: 20 }}>
        No SLP files found
      </Typography>
    </div>
  );
};

const generateFilterFunction = (
  filterOptions: FilterOptions
): ((file: FileResult) => boolean) => (file) => {
  if (filterOptions.hideShortGames) {
    if (file.lastFrame && file.lastFrame <= 30 * 60) {
      return false;
    }
  }

  const matchable = extractAllPlayerNames(file.settings, file.metadata);
  if (!filterOptions.searchText) {
    return true;
  } else if (matchable.length === 0) {
    return false;
  }
  return namesMatch([filterOptions.searchText], matchable);
};

const generateSortFunction = (
  filterOptions: FilterOptions
): ((a: FileResult, b: FileResult) => number) => (a, b) => {
  const aTime = a.startTime ? Date.parse(a.startTime) : 0;
  const bTime = b.startTime ? Date.parse(b.startTime) : 0;
  if (filterOptions.sortByNewestFirst) {
    return bTime - aTime;
  }
  return aTime - bTime;
};
