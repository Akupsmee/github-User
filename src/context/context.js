import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

export const GithubContext = React.createContext();

export const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  // request loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUser = async (user) => {
    toggleError() // ! to ensure error message is removed from screen after evey search
    setIsLoading(true)
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    // console.log(response.data);
    if (response) {
      setGithubUser(response.data);
      const {login, followers_url} =response.data

    //  await axios(`${rootUrl}/users/${login}/repos?per_page=100`)
    //   .then((response)=>{
    //     setRepos(response.data)
    //   }) 
      
    //  await axios(`${followers_url}?per_page=100`)
    //   .then((response)=>{
    //     setFollowers(response.data)
    //   }) 
      await Promise.allSettled([ // to make sure all data returns at the same time
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`)
      ]).then((results)=>{
          const [repos, followers] = results
          const status = 'fulfilled';
       
          if(repos.status === status){
              setRepos(repos.value.data)
          }
          if(followers.status === status){
              setFollowers(followers.value.data)
          }
      })

    } else {
      toggleError(true, "no user was found");
    }
    checkRequests()
    setIsLoading(false)
  };

  // check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        // remaining = 0
        setRequests(remaining);

        if (remaining === 0) {
          //throew an error
          toggleError(true, "There are no more requests,try again in an hour");
        }
      })
      .catch((err) => console.log(err));
  };

  // error
  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  useEffect(checkRequests, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export const useGlobalContext = () => React.useContext(GithubContext);
