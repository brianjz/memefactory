import { createGlobalStyle } from "styled-components";
import variables from "./variables";

const GlobalStyle = createGlobalStyle`
    ${variables}

    @font-face {
        font-family: 'Impact Regular';
        font-style: normal;
        font-weight: normal;
        src: local('Impact Regular'), url('impact.woff') format('woff');
    }

    html {
        box-sizing: border-box;
        width: 100%;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        scrollbar-color: var(--lower-blue) var(--white);
    }

    *,
    *:before,
    *:after {
        box-sizing: inherit;
    }

    body { 
        margin: 0;
        width: 100%;
        min-height: 100%;
        overflow-x: hidden;
        -moz-osx-font-smoothing: grayscale;
        -webkit-font-smoothing: antialiased;
        font-family: var(--font-sans);
        font-size: var(--fz-xl);
        line-height: 1.3;
        background-color: #111;
        color: #eee;

        .main {
            margin: 0 auto;
            margin-top: var(--below-navbar);
            width: 100%;
            max-width: 1600px;
            min-height: 100vh;
            padding: 0 100px;

            @media (max-width:768px) {
                padding: 0 10px;
            }
        }
    }

    .button {
        ${({ theme }) => theme.mixins.button};
    }

    a.inline-link {
        ${({ theme }) => theme.mixins.inlineLink};
    }
    a.external {
        &:after {
            content:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z'/%3E%3C/svg%3E");
            padding-left: 5px;
        }
    }
    #navBar a.inline-link {
        &:hover,
        &:focus,
        &:active {
            color: var(--white);
            & > * {
                color: var(--white) !important;
            }
        }
        &:after {
            background-color: var(--white);
        }
    }
    .search-death { cursor: pointer; }
    .death-total { font-size: 1.4em;}
    .alertbox { 
        ${({ theme }) => theme.mixins.alertBox };
    }
`;

export default GlobalStyle;