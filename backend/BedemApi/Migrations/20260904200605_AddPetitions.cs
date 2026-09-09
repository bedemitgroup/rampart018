using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BedemApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPetitions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Petitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Summary = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Recipient = table.Column<string>(type: "text", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    Goal = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ClosesAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OpenedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SignaturesPurgedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FinalSignatureCount = table.Column<int>(type: "integer", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Petitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Petitions_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PetitionSignatures",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PetitionId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    City = table.Column<string>(type: "text", nullable: false),
                    PublicDisplay = table.Column<bool>(type: "boolean", nullable: false),
                    ConsentText = table.Column<string>(type: "text", nullable: false),
                    ConsentVersion = table.Column<string>(type: "text", nullable: false),
                    PublicDisplayConsentText = table.Column<string>(type: "text", nullable: true),
                    SignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PetitionSignatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PetitionSignatures_Petitions_PetitionId",
                        column: x => x.PetitionId,
                        principalTable: "Petitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PetitionSignatures_Users_UserId",
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
                value: "$2a$11$OTmfoSVn.7nCDJWWccHH7ePUiH7lfoOkxSlvtASUDXJmpckqkESdO");

            migrationBuilder.CreateIndex(
                name: "IX_Petitions_ClosedAt",
                table: "Petitions",
                column: "ClosedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Petitions_CreatedByUserId",
                table: "Petitions",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Petitions_Slug",
                table: "Petitions",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Petitions_Status",
                table: "Petitions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_PetitionSignatures_PetitionId_PublicDisplay",
                table: "PetitionSignatures",
                columns: new[] { "PetitionId", "PublicDisplay" });

            migrationBuilder.CreateIndex(
                name: "IX_PetitionSignatures_PetitionId_UserId",
                table: "PetitionSignatures",
                columns: new[] { "PetitionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PetitionSignatures_UserId",
                table: "PetitionSignatures",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PetitionSignatures");

            migrationBuilder.DropTable(
                name: "Petitions");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$Q4d0PsLTCyWrkoQAYwVqBuV0IIOBeLdG.RnmYfFOu.5CJAGprjMQm");
        }
    }
}
