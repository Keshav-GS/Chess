# About
A website to play chess against other people and bots. Comes bundled with a tool to convert a digital-chess-position-image into a usable FEN.

# Set-up
1. Install dependencies:
````npm install````
2. Setup the MySQL database:
   
    ````
    
	CREATE DATABASE chessDB;
	use chessDB;

	CREATE TABLE USER_ROLE (
		roleId int AUTO_INCREMENT,
		roleName varchar(255),
            PRIMARY KEY(roleId)
	);
	INSERT INTO USER_ROLE(roleName) VALUES('player'), ('admin');

	CREATE TABLE USER (
			userId BIGINT AUTO_INCREMENT,
    		userName varchar(255) UNIQUE NOT NULL,
    		password varchar(255) NOT NULL,
    		joinDate DATE,
    		rating int,
    		roleId int DEFAULT 1,
			PRIMARY KEY(userId),
    		FOREIGN KEY(roleId) REFERENCES USER_ROLE(roleId)
	);

	CREATE TABLE USER_VS_USER_GAME (
			gameId varchar(36),
    		whiteId BIGINT NOT NULL,
    		blackId BIGINT NOT NULL,
    		date DATE,
    		time TIME,
    		pgn varchar(255),
    		result TINYINT,
    		resultComment varchar(100),
    		PRIMARY KEY(gameId),
    		FOREIGN KEY(whiteId) REFERENCES USER(userId),
    		FOREIGN KEY(blackId) REFERENCES USER(userId)
	);

 	CREATE TABLE Gvb1(
      		Game_ID BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      		User_ID BIGINT ,
      		Bot_ID BIGINT ,
      		Game_date VARCHAR(255),
      		Game_time VARCHAR(255) ,
      		PGN VARCHAR(1000) ,
      		Winner VARCHAR(255) 
  	);

	CREATE TABLE BOT(
  		Bot_ID BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  		Rating BIGINT
	);

	INSERT INTO BOT(Rating) VALUES(400),(900);

	CREATE TABLE FEEDBACK(
			feedbackId BIGINT AUTO_INCREMENT,
			userId BIGINT NOT NULL,
    		date DATE,
    		time TIME,
    		content varchar(255),
    		PRIMARY KEY(feedbackId),
    		FOREIGN KEY(userId) REFERENCES USER(userId)
	); 

3. Create and setup <b>.env</b> file
4. Start the app: ````npm start````
5. In the browser, type:  http://localhost:portNumber/ChessWebsite
