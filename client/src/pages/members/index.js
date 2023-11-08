// 套件
import axios from "axios";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
// 檔案
import "./index.css";
import VisualTable from "../../components/visualTable";
import { ckan_default, ckan_token } from "../../global/constants";

export default function Members() {
  // 網頁跳轉涵式
  const navigate = useNavigate();
  // 取得keycloak資訊
  const { keycloak } = useKeycloak();
  // 使用者keycloak資訊
  const [userInfo, setUserInfo] = useState({});
  // 可操作列表(orgnization[org]+package[pkg])
  const [operationList, setOperationList] = useState([]);
  // 有權限的org列表
  const [orgList, setOrgList] = useState([]);
  // 有權限的pkg列表
  const [pkgList, setPkgList] = useState([]);
  // 成員資料
  const [members, setMembers] = useState([]);
  // 權限變更
  const [roleChange, setRoleChange] = useState({});
  // 欄位
  const field = [
    { id: 1, name: "index", display: "No." },
    { id: 2, name: "name", display: "Name" },
    { id: 3, name: "email", display: "E-mail" },
    { id: 4, name: "capacity", display: "Role" },
  ];

  // 首次刷新時，取得使用者登入資訊
  useEffect(() => {
    getUserInfo();
  }, []);
  // 取keycloak中的user資料
  async function getUserInfo() {
    await keycloak
      .loadUserProfile()
      .then((res) => {
        setUserInfo(res);
      })
      .catch((e) => {
        console.log(e);
        alert("登入錯誤");
        navigate("/");
      });
  }
  // 當使用者資料更新時，取得操作列表
  useEffect(() => {
    if (userInfo.email !== undefined) {
      getOperationList();
    }
    setOperationList([]);
    setOrgList([]);
    setPkgList([]);
    setMembers([]);
    setRoleChange({});
  }, [userInfo]);
  // 取得使用者可操作列表(orgnization[org]+package[pkg])
  async function getOperationList() {
    // 待補：透過saml取得user在ckan的name
    let userName = userInfo.email.split("@")[0];
    userName = userName.replace(".", "-");
    getOrgPkgList(userName);
    getPkgList(userName);
  }
  // 取得組織資料集列表
  async function getOrgPkgList(userName) {
    /*
    get ckan organization_list_for_user
    filter organization capacity=admin
    get ckan organization_package_list
    filter name not includes -type-private
    */
    // 取得組織列表
    await axios
      .get(`${ckan_default}api/ckan/organization_list_for_user`, {
        params: { id: userName },
        headers: {
          Authorization: ckan_token,
        },
      })
      .then((res) => {
        const resData = res.data;
        // 篩選出admin身分的組織
        const adminList = resData.filter((org) => org.capacity === "admin");
        adminList.map((element) => {
          // 取得組織裡的所有資料集
          getOrgPackageList(element.id);
        });
        setOperationList(adminList);
      })
      .catch((e) => {
        console.log(e);
      });
  }
  // 取得組織所擁有資料集
  async function getOrgPackageList(orgId) {
    await axios
      .get(`${ckan_default}api/ckan/organization_package_list`, {
        params: { id: orgId },
        headers: {
          Authorization: ckan_token,
        },
      })
      .then((res) => {
        let tmp = [];
        res.data.map((element) => {
          if (element.name.includes("-type-private")) {
            tmp.push(element);
          }
        });
        setOperationList((prev) => {
          return [...prev, ...tmp];
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
  // 取得單獨資料集列表
  async function getPkgList() {}

  // 取得選取範圍org/dataset內的成員
  async function getMembers(type, id) {
    let api = "";
    if (type === "organization") {
      api = `${ckan_default}api/ckan/organization_info`;
    } else if (type === "dataset") {
      api = `${ckan_default}api/ckan/collaborator_list`;
    }
    if (api !== "") {
      await axios
        .get(api, {
          params: { id: id },
          headers: {
            Authorization: ckan_token,
          },
        })
        .then(async (res) => {
          if (type === "organization") {
            const tmp = res.data.users;
            const memberInfo = await getCkanUser(tmp, "id", "organization", id);
            setMembers(memberInfo);
          } else if (type === "dataset") {
            const tmp = res.data;
            const memberInfo = await getCkanUser(tmp, "user_id", "dataset", id);
            setMembers(memberInfo);
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }
  // 取得ckan的user資訊 (type和id是為了表格操作放入的)
  async function getCkanUser(arr, field_name, type, id) {
    // promise將區塊內程序打包使執行序完全執行後才往下運行
    const res = await Promise.all(
      arr.map(async (element) => {
        return await axios
          .get(`${ckan_default}api/ckan/user_info`, {
            params: { id: element[field_name] },
            headers: {
              Authorization: ckan_token,
            },
          })
          .then((res) => {
            const tmp = res.data;
            const operate = { type: type, id: id, user: tmp.name, role: element.capacity, display: true };
            // operate內的名稱會連動到changeOperate方法
            return { name: tmp.name, email: tmp.email, capacity: element.capacity, operate: operate };
          })
          .catch((e) => {
            console.error(e);
            return { name: "", email: "" };
          });
      })
    );
    return res;
  }

  return (
    <>
      {/* 操作選單 */}
      <div style={{ background: "#fff" }}>
        <ul>
          {operationList.map((element, index) => {
            return (
              <li
                key={`operationList_${index}`}
                onClick={() => {
                  getMembers(element.type, element.id);
                }}
              >{`${element.type}:  ${element.title}-${element.private}`}</li>
            );
          })}
        </ul>
      </div>
      <div>
        <VisualTable field={field} data={members} operate={setRoleChange} />
      </div>
      {/* 權限變換對話框 */}
      <ChangeOperate roleChange={roleChange} setRoleChange={setRoleChange} />
    </>
  );
}
function ChangeOperate({ roleChange, setRoleChange }) {
  // type:organization/dataset,
  // id:(org/set)'s id,
  // name:user's name,
  // role:original role
  const roleList = [
    { id: 0, value: "admin", display: "admin" },
    { id: 1, value: "editor", display: "editor" },
    { id: 2, value: "member", display: "member" },
  ];
  function closeChangeRole() {
    setRoleChange((prev) => {
      return {
        ...prev,
        display: false,
      };
    });
  }
  async function sendChange(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    let formJson = Object.fromEntries(formData.entries());
    let api = `${ckan_default}api/ckan`;
    if (roleChange.type === "dataset") {
      api += "/collaborator_edit";
    } else {
      api += "/organization_member_edit";
    }
    await axios
      .post(
        api,
        {
          id: roleChange.id,
          users: [roleChange.user],
          role: formJson.role,
        },
        {
          headers: {
            Authorization: ckan_token,
          },
        }
      )
      .then((res) => {
        console.log(res);
      })
      .catch((e) => {
        console.error(e);
      });
    setRoleChange((prev) => {
      return {
        ...prev,
        display: false,
      };
    });
  }
  return (
    <>
      {roleChange.display && (
        <form onSubmit={sendChange}>
          <>權限變更-{roleChange.name}</>
          <>{roleChange.user}</>
          <>目前權限:{roleChange.role}</>
          <>
            更改為:
            <select name="role">
              {roleList.map((element) => {
                return (
                  <option key={`role_${element.id}`} value={element.value}>
                    {element.display}
                  </option>
                );
              })}
            </select>
          </>
          <div>
            <button
              type="button"
              onClick={() => {
                closeChangeRole();
              }}
            >
              cancel
            </button>
            <button type="submit">change</button>
          </div>
        </form>
      )}
    </>
  );
}
