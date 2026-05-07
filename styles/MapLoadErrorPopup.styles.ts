import styled from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const Modal = styled.div`
  background: white;
  border-radius: 12px;
  text-align: center;
  width: 350px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
`;

export const PopupHeader = styled.div`
  background: #407BFF;
  padding: 20px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
  font-family: 'Inter', sans-serif;
`;

export const Message = styled.p`
  margin: 20px 0;
  font-size: 1rem;
  color: #333;
  padding: 0 10px;
  font-family: 'Inter', sans-serif;
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 10px;
`;

export const Button = styled.button`
  padding: 5px 10px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  font-family: 'Inter', sans-serif;
  width: 100px;

  color: white;
  background: #407BFF;
  border: 2px solid #407BFF;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: #3366CC;
    border-color: #3366CC;
  }
`;
