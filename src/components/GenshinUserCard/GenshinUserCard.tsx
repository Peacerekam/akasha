import React from "react";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Spinner } from "../Spinner";
import "./style.scss";
import { ARBadge } from "../ARBadge";
import { RegionBadge } from "../RegionBadge";

export type AccountDataForUserCard = {
  uid: string;
  profilePictureLink?: string;
  nameCardLink?: string;
  playerInfo: {
    region?: string;
    level?: number;
    nickname?: string;
    signature?: string;
  };
};

type GenshinUserCardProps = {
  showBackgroundImage?: boolean;
  isAccountOwner?: boolean;
  handleToggleModal?: any;
  accountData: {
    account: AccountDataForUserCard;
  };
};

export const GenshinUserCard: React.FC<GenshinUserCardProps> = ({
  showBackgroundImage = false,
  isAccountOwner = false,
  handleToggleModal,
  accountData,
}) => {
  const playerInfo = accountData.account?.playerInfo;

  if (!playerInfo) {
    return (
      <div className="genshin-user-card">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Spinner />
        </div>
      </div>
    );
  }

  const style = {
    backgroundImage: `url(${accountData.account.nameCardLink})`,
  } as React.CSSProperties;

  return (
    <>
      {showBackgroundImage && <div className="card-background" style={style} />}
      <div
        className={[
          "genshin-user-card",
          isAccountOwner ? "pointer clickable-card" : "",
        ]
          .join(" ")
          .trim()}
        onClick={handleToggleModal}
      >
        {accountData.account.profilePictureLink ? (
          <img
            className="profile-picture"
            src={accountData.account.profilePictureLink}
          />
        ) : (
          <FontAwesomeIcon
            style={{ opacity: 0.33 }}
            className="default-picture"
            icon={faUser}
            size="1x"
          />
        )}

        <div className="genshin-card-content">
          <div className="card-big-text">{playerInfo.nickname}</div>
          <div className="card-signature">{playerInfo.signature || ""}</div>
        </div>
        <div className="float-top-right">
          <RegionBadge region={playerInfo.region} />
          <ARBadge adventureRank={playerInfo.level} />
        </div>
      </div>
    </>
  );
};
