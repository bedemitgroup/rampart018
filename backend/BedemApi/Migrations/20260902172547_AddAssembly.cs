using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BedemApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAssembly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AssemblySessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: true),
                    OnlineUrl = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    QuorumRequired = table.Column<int>(type: "integer", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    OpenedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssemblySessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssemblySessions_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AssemblyAttendances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Response = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    CheckedInAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CheckInMode = table.Column<string>(type: "text", nullable: true),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssemblyAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssemblyAttendances_AssemblySessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "AssemblySessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssemblyAttendances_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AssemblyTopics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionId = table.Column<int>(type: "integer", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ProposedByUserId = table.Column<int>(type: "integer", nullable: false),
                    ReviewedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewNote = table.Column<string>(type: "text", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    VotingStatus = table.Column<string>(type: "text", nullable: false),
                    VotingOpenedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VotingClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EligibleVotersAtOpen = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssemblyTopics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssemblyTopics_AssemblySessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "AssemblySessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssemblyTopics_Users_ProposedByUserId",
                        column: x => x.ProposedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssemblyTopics_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AssemblyVotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TopicId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    VoterUsername = table.Column<string>(type: "text", nullable: false),
                    Choice = table.Column<string>(type: "text", nullable: false),
                    CastAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssemblyVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssemblyVotes_AssemblyTopics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "AssemblyTopics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssemblyVotes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$R4WFqHd5HrdRAmTYVrVxb.PoJoKKTvaDqCUebqhB0z7pCQOKSDQvy");

            migrationBuilder.CreateIndex(
                name: "IX_AssemblyAttendances_SessionId_UserId",
                table: "AssemblyAttendances",
                columns: new[] { "SessionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssemblyAttendances_UserId",
                table: "AssemblyAttendances",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AssemblySessions_CreatedByUserId",
                table: "AssemblySessions",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AssemblySessions_ScheduledAt",
                table: "AssemblySessions",
                column: "ScheduledAt");

            migrationBuilder.CreateIndex(
                name: "IX_AssemblySessions_SingleInProgress",
                table: "AssemblySessions",
                column: "Status",
                unique: true,
                filter: "\"Status\" = 'U toku'");

            migrationBuilder.CreateIndex(
                name: "IX_AssemblyTopics_ProposedByUserId",
                table: "AssemblyTopics",
                column: "ProposedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AssemblyTopics_ReviewedByUserId",
                table: "AssemblyTopics",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AssemblyTopics_SessionId_DisplayOrder",
                table: "AssemblyTopics",
                columns: new[] { "SessionId", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_AssemblyTopics_Status",
                table: "AssemblyTopics",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AssemblyVotes_TopicId_UserId",
                table: "AssemblyVotes",
                columns: new[] { "TopicId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssemblyVotes_UserId",
                table: "AssemblyVotes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssemblyAttendances");

            migrationBuilder.DropTable(
                name: "AssemblyVotes");

            migrationBuilder.DropTable(
                name: "AssemblyTopics");

            migrationBuilder.DropTable(
                name: "AssemblySessions");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$QltQNyVsitHI4J1M58ohNu824V3ufgUHgmqVCzbSLMQvRzHtAoCOO");
        }
    }
}
